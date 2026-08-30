import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { supabase } from './supabaseClient';
import { useAuth } from './AuthContext';
import {
  distanceToStairwayMeters,
  getVerificationThresholdMeters,
} from './verificationUtils';
import {
  getCurrentDevicePosition,
  supportsDeviceGeolocation,
} from './nativeDevice';
import { fetchAllCheckIns, storagePathFromPublicUrl } from './checkInData';
import {
  firstRpcRow,
  isMissingVerifiedVisitsRpc,
} from './verifiedVisits';
import { getLocationErrorKind } from './locationErrors';

export { storagePathFromPublicUrl } from './checkInData';

const CheckInsContext = createContext(null);

export function CheckInsProvider({ children }) {
  const { user } = useAuth();
  const [checkedInIds, setCheckedInIds] = useState(new Set());
  const [checkedInDates, setCheckedInDates] = useState(new Map());
  const [checkedInMethods, setCheckedInMethods] = useState(new Map());
  const [checkedInPhotoUrls, setCheckedInPhotoUrls] = useState(new Map());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setCheckedInIds(new Set());
      setCheckedInDates(new Map());
      setCheckedInMethods(new Map());
      setCheckedInPhotoUrls(new Map());
      return;
    }

    let isMounted = true;
    setLoading(true);

    fetchAllCheckIns(supabase, user.id).then(({ data, error }) => {
      if (!isMounted) return;
      if (!error && data) {
        setCheckedInIds(new Set(data.map((row) => row.stairway_id)));
        setCheckedInDates(
          new Map(data.map((row) => [row.stairway_id, row.created_at]))
        );
        setCheckedInMethods(
          new Map(
            data.map((row) => [
              row.stairway_id,
              row.verification_method || 'self-reported',
            ])
          )
        );
        setCheckedInPhotoUrls(
          new Map(
            data
              .filter((row) => row.photo_url)
              .map((row) => [row.stairway_id, row.photo_url])
          )
        );
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [user]);

  const toggleCheckIn = useCallback(
    async (stairwayId) => {
      if (!user) return { error: 'not-signed-in' };

      const wasChecked = checkedInIds.has(stairwayId);

      setCheckedInIds((prev) => {
        const next = new Set(prev);
        wasChecked ? next.delete(stairwayId) : next.add(stairwayId);
        return next;
      });

      if (wasChecked) {
        // Grab this before clearing local state below, since we need it
        // to clean up the actual photo file in storage -- otherwise a
        // removed check-in leaves an orphaned file behind forever.
        const photoUrlToClean = checkedInPhotoUrls.get(stairwayId);

        const storagePath = storagePathFromPublicUrl(photoUrlToClean);
        if (storagePath) {
          const { error: removeError } = await supabase.storage
            .from('checkin-photos')
            .remove([storagePath]);
          if (removeError) {
            setCheckedInIds((prev) => new Set(prev).add(stairwayId));
            return { error: removeError };
          }
        }

        setCheckedInDates((prev) => {
          const next = new Map(prev);
          next.delete(stairwayId);
          return next;
        });
        setCheckedInMethods((prev) => {
          const next = new Map(prev);
          next.delete(stairwayId);
          return next;
        });
        setCheckedInPhotoUrls((prev) => {
          const next = new Map(prev);
          next.delete(stairwayId);
          return next;
        });

        const { error } = await supabase
          .from('check_ins')
          .delete()
          .eq('user_id', user.id)
          .eq('stairway_id', stairwayId);

        if (error) {
          setCheckedInIds((prev) => new Set(prev).add(stairwayId));
          return { error };
        }

      } else {
        const optimisticDate = new Date().toISOString();
        setCheckedInDates((prev) =>
          new Map(prev).set(stairwayId, optimisticDate)
        );
        setCheckedInMethods((prev) =>
          new Map(prev).set(stairwayId, 'self-reported')
        );

        const { data, error } = await supabase
          .from('check_ins')
          .insert({ user_id: user.id, stairway_id: stairwayId })
          .select('created_at')
          .single();

        if (error) {
          setCheckedInIds((prev) => {
            const next = new Set(prev);
            next.delete(stairwayId);
            return next;
          });
          setCheckedInDates((prev) => {
            const next = new Map(prev);
            next.delete(stairwayId);
            return next;
          });
          setCheckedInMethods((prev) => {
            const next = new Map(prev);
            next.delete(stairwayId);
            return next;
          });
          return { error };
        }

        if (data?.created_at) {
          setCheckedInDates((prev) =>
            new Map(prev).set(stairwayId, data.created_at)
          );
        }
      }

      return { error: null };
    },
    [user, checkedInIds, checkedInPhotoUrls]
  );

  const fetchVerifiedVisitDetails = useCallback(
    async (stairwayId) => {
      if (!user) return { data: null, error: 'not-signed-in' };

      const [summaryResult, historyResult] = await Promise.all([
        supabase.rpc('get_stairway_visit_summary', {
          p_stairway_id: stairwayId,
        }),
        supabase.rpc('get_my_verified_visit_history', {
          p_stairway_id: stairwayId,
        }),
      ]);

      const rpcError = summaryResult.error || historyResult.error;
      if (rpcError) {
        if (isMissingVerifiedVisitsRpc(rpcError)) {
          return { data: null, error: null, unavailable: true };
        }
        return { data: null, error: rpcError, unavailable: false };
      }

      return {
        data: {
          summary: firstRpcRow(summaryResult.data),
          history: historyResult.data || [],
        },
        error: null,
        unavailable: false,
      };
    },
    [user]
  );

  const verifyWithPhoto = useCallback(
    async (stairway) => {
      if (!user) return { error: 'not-signed-in' };

      if (!supportsDeviceGeolocation()) {
        return { error: 'no-geolocation' };
      }

      let position;
      try {
        position = await getCurrentDevicePosition({
          enableHighAccuracy: true,
          timeout: 15000,
        });
      } catch (locationFailure) {
        return {
          error: 'location-failed',
          locationErrorKind: getLocationErrorKind(locationFailure),
        };
      }

      // Three ways a stairway can be checked, in order of precedence:
      //  1. A line (street/trail with a real start and end) -- distance
      //     is measured to the nearest point anywhere along that line,
      //     not just to one center point. Best fit for anything that
      //     runs the length of a street.
      //  2. A plain radius override -- same idea as the default, just a
      //     bigger circle, for a stairway that's roughly one spot but
      //     longer/taller than most.
      //  3. The app-wide default circle, for everything else.
      const distanceMeters = distanceToStairwayMeters(
        {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        },
        stairway
      );

      // For a line, this is the tolerance to either side of it, not a
      // "how far from the center" radius -- reuses the same column for
      // simplicity rather than adding a whole separate field for it.
      const thresholdMeters = getVerificationThresholdMeters(stairway);

      if (distanceMeters > thresholdMeters) {
        return {
          error: 'too-far',
          distance: Math.round(distanceMeters / 0.3048), // meters -> feet
        };
      }

      const nowIso = new Date().toISOString();

      // The new RPC upgrades the lifetime Spotted record and records today's
      // private repeat visit in one transaction. Until its migration is
      // installed, retain the old verification write so a web deployment can
      // never break the already-working verification feature.
      const visitResult = await supabase.rpc('record_verified_visit', {
        p_stairway_id: stairway.id,
      });
      let visit = null;
      let visitFeatureAvailable = true;

      if (visitResult.error) {
        if (!isMissingVerifiedVisitsRpc(visitResult.error)) {
          return { error: 'save-failed' };
        }

        visitFeatureAvailable = false;
        const { error: fallbackError } = await supabase.from('check_ins').upsert(
          {
            user_id: user.id,
            stairway_id: stairway.id,
            verification_method: 'photo-verified',
            verified_at: nowIso,
          },
          { onConflict: 'user_id,stairway_id' }
        );

        if (fallbackError) {
          return { error: 'save-failed' };
        }
      } else {
        visit = firstRpcRow(visitResult.data);
      }

      setCheckedInIds((prev) => new Set(prev).add(stairway.id));
      setCheckedInDates((prev) => {
        if (prev.has(stairway.id)) return prev;
        return new Map(prev).set(stairway.id, nowIso);
      });
      setCheckedInMethods((prev) =>
        new Map(prev).set(stairway.id, 'photo-verified')
      );

      return { error: null, visit, visitFeatureAvailable };
    },
    [user]
  );

  const verifiedCount = [...checkedInMethods.values()].filter(
    (m) => m === 'photo-verified'
  ).length;

  const value = {
    checkedInIds,
    checkedInDates,
    checkedInMethods,
    checkedInPhotoUrls,
    loading,
    toggleCheckIn,
    verifyWithPhoto,
    fetchVerifiedVisitDetails,
    count: checkedInIds.size,
    verifiedCount,
  };

  return (
    <CheckInsContext.Provider value={value}>
      {children}
    </CheckInsContext.Provider>
  );
}

export function useCheckIns() {
  const ctx = useContext(CheckInsContext);
  if (!ctx) {
    throw new Error('useCheckIns must be used within a CheckInsProvider');
  }
  return ctx;
}
