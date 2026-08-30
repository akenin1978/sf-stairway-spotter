import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  Marker,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { supabase } from '../supabaseClient';
import { useAuth } from '../AuthContext';
import { useCheckIns } from '../CheckInsContext';
import { useBadges } from '../BadgesContext';
import MapControlsPanel from './MapControlsPanel';
import { getRatingStyle } from '../ratingColors';
import BadgeEarnedModal from './BadgeEarnedModal';
import ConfirmDialog from './ConfirmDialog';
import AlertDialog from './AlertDialog';
import NewStairwayModal from './NewStairwayModal';
import VerifiedVisitPanel from './VerifiedVisitPanel';
import {
  GPS_THRESHOLD_METERS,
  distanceToStairwayMeters,
} from '../verificationUtils';
import {
  captureTemporaryVerificationPhoto,
  clearDeviceLocationWatch,
  getCurrentDevicePosition,
  isNativeApp,
  startDeviceLocationWatch,
  supportsDeviceGeolocation,
} from '../nativeDevice';
import {
  findNewStairwayNotice,
  knownStairwayIdsKey,
  serializeKnownStairwayIds,
} from '../newStairwayNotice';
import { getStairwayMapBounds, isWithinBounds } from '../mapBounds';
import {
  didBecomeMayor,
  verificationButtonLabel,
} from '../verifiedVisits';
import { addNearbyThumbnailPhotos } from '../nearbyStairways';
import { getLocationErrorMessage } from '../locationErrors';

// Slightly south of the city's geographic midpoint so the dense stairway
// area sits visually centered above the bottom map controls on a phone.
const SF_CENTER = { lat: 37.74, lng: -122.4194 };

// The set of rating "buckets" that can be toggled on/off: 5 down to 1, plus
// a special 'unrated' bucket for anything with no rating value.
const ALL_RATING_KEYS = [5, 4, 3, 2, 1, 'unrated'];
const VERIFICATION_PRIVACY_HINT_DISMISSED_KEY =
  'sf_stairway_verification_privacy_hint_dismissed';

// Google's photo links end in a size/crop instruction like "=w600-h315-p-k"
// (width-height-pad/crop-flag). Swapping it for just a width (no height, no
// crop flag) asks Google's servers for the image scaled proportionally,
// with nothing cut off.
function uncroppedPhotoUrl(url) {
  if (!url) return url;
  return url.replace(/=[^=]*$/, '=w1200');
}

function ratingKey(rating) {
  return rating == null ? 'unrated' : rating;
}

// Camera-only capture and reliable GPS both depend on being on a phone or
// tablet, not a laptop/desktop. Modern iPads report their user agent as
// "Macintosh" (Apple did this on purpose for web compatibility), so a
// plain device-name check alone would wrongly treat an iPad as a desktop
// -- checking for touch support alongside catches that case too.
function isMobileOrTablet() {
  if (isNativeApp()) return true;
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isObviouslyMobile = /iPhone|iPad|iPod|Android/i.test(ua);
  const isTouchDisguisedAsMac =
    /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  return isObviouslyMobile || isTouchDisguisedAsMac;
}

// Purely cosmetic-but-necessary: gently centers the map on whichever
// stairway is selected. Google's own InfoWindow auto-pan is supposed to
// handle bringing a tapped/off-screen marker into view on its own, but in
// practice that's not reliable enough by itself on mobile -- especially
// once our own max-height/overflow-y CSS on the card content is in the
// mix. This is intentionally simple (no DOM measurement, no timing
// dependency on photos loading) specifically so it can't reintroduce the
// fragility of the old pixel-measuring approach we removed earlier.
function MapRecenter({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    map.panTo({ lat: target.latitude, lng: target.longitude });
    // Dead-centering the marker only leaves half the screen's height
    // above it -- often not enough room for a tall card (title +
    // description + rating/steps line + full photo + two action
    // buttons). Shifting the marker further down the screen leaves much
    // more headroom above it for the card to actually fit. This is a
    // fixed, deterministic offset (not a measurement of the actual
    // card), so it can't reintroduce the fragility of the pixel-
    // measuring approach we removed earlier. Bumped from -140 to -230
    // after a real card (photo + meta line + Mark as spotted + Verify
    // with photo) still had its title clipped above the screen at the
    // smaller offset -- backed up by the card's own internal scroll
    // (see .info-window CSS) for the rare card still too tall even with
    // this much room.
    map.panBy(0, -230);
  }, [map, target]);

  return null;
}

// Pans (and zooms in on) the map whenever a new "my location" result comes
// in. Mirrors MapRecenter above -- same simple, no-DOM-measurement approach.
function PanToUserLocation({ target }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !target) return;
    map.panTo({ lat: target.lat, lng: target.lng });
    map.setZoom(16);
  }, [map, target]);

  return null;
}

// Start signed-out visitors with the whole city framed cleanly, and return
// to that same home view once when authentication changes. After this one
// reset the map remains completely under the user's control.
function MapHomeView({ sessionKey }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.setCenter(SF_CENTER);
    // A desktop browser has much more horizontal room than a phone. Using
    // the phone's zoom there made the city feel cropped on arrival, while
    // zoom 11 gives web visitors an immediate whole-city overview. Keep the
    // approved, closer phone framing unchanged.
    map.setZoom(isMobileOrTablet() ? 12 : 11);
    const frame = requestAnimationFrame(() => {
      // Match the phone launch crop measured from the approved reference:
      // move the map content right while retaining the centered vertical
      // framing and one Treasure Island marker at the edge.
      map.panBy(-40, 0);
    });
    return () => cancelAnimationFrame(frame);
  }, [map, sessionKey]);

  return null;
}

function StairwayMarkers({
  stairways,
  checkedInIds,
  checkedInMethods,
  spotMode,
  onSelect,
}) {
  return stairways.map((stairway) => {
    const style = getRatingStyle(stairway.rating);
    const isChecked = checkedInIds.has(stairway.id);
    const isVerified =
      checkedInMethods.get(stairway.id) === 'photo-verified';

    return (
      <Marker
        key={stairway.id}
        position={{ lat: stairway.latitude, lng: stairway.longitude }}
        onClick={() => {
          if (!spotMode) onSelect(stairway);
        }}
        icon={{
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: style.color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 1.5,
          scale: 8,
        }}
        label={
          isVerified
            ? {
                text: '★',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold',
              }
            : isChecked
            ? {
                text: '✓',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 'bold',
              }
            : undefined
        }
      />
    );
  });
}

// Tracks the map's current visible area (with some padding) so the
// stairway list can be culled to only what's on/near screen, instead of
// rendering all ~1200 markers regardless of zoom level. Updates on
// 'idle' -- which fires once after a pan/zoom gesture settles, not on
// every frame -- so recalculating bounds doesn't itself cause a
// re-render storm during the gesture.
function ViewportBoundsTracker({
  onBoundsChange,
  onInteractionChange,
  onZoomChange,
}) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    function updateBounds() {
      const bounds = map.getBounds();
      if (!bounds) return;
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      const latSpan = ne.lat() - sw.lat();
      const lngSpan = ne.lng() - sw.lng();
      const padding = 0.3; // 30% extra margin so markers don't pop in/out abruptly while panning
      onBoundsChange({
        north: ne.lat() + latSpan * padding,
        south: sw.lat() - latSpan * padding,
        east: ne.lng() + lngSpan * padding,
        west: sw.lng() - lngSpan * padding,
      });
    }

    function handleInteractionStart() {
      onInteractionChange(true);
    }

    function handleIdle() {
      updateBounds();
      onZoomChange(map.getZoom());
      onInteractionChange(false);
    }

    const listeners = [
      map.addListener('dragstart', handleInteractionStart),
      map.addListener('zoom_changed', handleInteractionStart),
      map.addListener('idle', handleIdle),
    ];

    // Pointer events catch touch, pen, and mouse interaction immediately,
    // including mobile pinch gestures that Google Maps may classify
    // differently from a desktop drag.
    const container = map.getDiv();
    container.addEventListener('pointerdown', handleInteractionStart, {
      passive: true,
    });

    updateBounds();
    onZoomChange(map.getZoom());

    return () => {
      listeners.forEach((listener) => listener.remove());
      container.removeEventListener('pointerdown', handleInteractionStart);
    };
  }, [map, onBoundsChange, onInteractionChange, onZoomChange]);

  return null;
}

// The round "locate me" button that floats over the map, bottom-right,
// positioned above Google's own zoom controls so the two don't overlap.
function LocateMeButton({ onLocate, locating }) {
  return (
    <button
      type="button"
      className="locate-me-button"
      onClick={onLocate}
      disabled={locating}
      aria-label="Find my location"
      title="Find my location"
      style={{
        position: 'absolute',
        bottom: '164px',
        right: '10px',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        border: 'none',
        background: '#ffffff',
        boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: locating ? 'default' : 'pointer',
        padding: 0,
        zIndex: 5,
      }}
    >
      {locating ? (
        <span style={{ fontSize: '14px' }}>…</span>
      ) : (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="3" fill="#4b3ce0" />
          <path
            d="M12 2 L12 5 M12 19 L12 22 M2 12 L5 12 M19 12 L22 12"
            stroke="#4b3ce0"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      )}
    </button>
  );
}

function CheckInNearbyButton({ onClick, locating, disabled }) {
  return (
    <button
      type="button"
      className="check-in-nearby-button"
      onClick={onClick}
      disabled={disabled || locating}
    >
      <span className="check-in-nearby-icon" aria-hidden="true">✓</span>
      {locating ? 'Finding you…' : 'Check In'}
    </button>
  );
}

function formatNearbyDistance(distanceMeters) {
  const feet = Math.round(distanceMeters / 0.3048);
  if (feet < 1000) return `${feet} ft away`;
  return `${(feet / 5280).toFixed(1)} mi away`;
}

function formatSpottedDate(isoString) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function StairwayMap({
  onReportIssue,
  onRequireSignIn,
  spotMode,
  onCancelSpot,
  spottedListOpen,
  onCloseSpottedList,
}) {
  const [stairways, setStairways] = useState([]);
  const [selected, setSelected] = useState(null);
  const [newStairwayNotice, setNewStairwayNotice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();
  const {
    checkedInIds,
    checkedInDates,
    checkedInMethods,
    toggleCheckIn,
    verifyWithPhoto,
    fetchVerifiedVisitDetails,
  } = useCheckIns();
  const { checkAndAwardBadges } = useBadges();

  // A stairway selected before signing in or out should never carry over
  // into the new session's clean home view.
  useEffect(() => {
    setSelected(null);
  }, [user?.id]);

  // Photo URLs are deliberately left out of the 1,200+ row startup query.
  // Fetch the two photo fields only for the marker somebody actually opens,
  // which keeps the initial map payload substantially smaller without
  // changing the information shown in the card.
  useEffect(() => {
    if (!selected?.id || selected.direct_photo_url || selected.photo_url) return;
    let isCurrent = true;

    supabase
      .from('stairways')
      .select('direct_photo_url, photo_url')
      .eq('id', selected.id)
      .single()
      .then(({ data, error }) => {
        if (!isCurrent || error || !data) return;
        setSelected((current) =>
          current?.id === selected.id ? { ...current, ...data } : current
        );
      });

    return () => {
      isCurrent = false;
    };
  }, [selected?.id]);

  // --- Badge-earned alert state ---
  const [badgeQueue, setBadgeQueue] = useState([]);

  // --- Custom confirm dialog state (replaces window.confirm, which always
  // shows the raw site URL -- not ideal before we have a custom domain) ---
  const [confirmAction, setConfirmAction] = useState(null); // { message, onConfirm } | null
  const [completionMessage, setCompletionMessage] = useState('');
  const [locationBoundaryMessage, setLocationBoundaryMessage] = useState('');

  const showOutsideSanFranciscoMessage = () => {
    setLocationBoundaryMessage(
      "This app works best when you're in San Francisco. The map will stay centered on the city."
    );
  };

  async function closeSelectedAfterSuccess(stairwayId, message) {
    setCompletionMessage(message);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setSelected((current) => (current?.id === stairwayId ? null : current));
  }

  // Shared logic for adding a check-in + checking for newly-earned badges.
  // Pulled out of the button's onClick so both the direct-toggle path and
  // the "confirmed via dialog" path call the exact same code.
  async function performCheckInToggle(stairway) {
    const wasAdding = !checkedInIds.has(stairway.id);
    const result = await toggleCheckIn(stairway.id);

    if (wasAdding && !result.error) {
      const updatedIds = new Set(checkedInIds).add(stairway.id);
      checkAndAwardBadges(stairways, updatedIds, stairway.id)
        .then((newBadges) => {
          if (newBadges && newBadges.length > 0) setBadgeQueue(newBadges);
        })
        .catch((err) => console.error('Badge check failed', err));
    }

    if (!result.error) {
      await closeSelectedAfterSuccess(
        stairway.id,
        wasAdding ? 'Spotted! ✓' : 'Removed from spotted.'
      );
    }
  }

  // --- Photo verification state ---
  const [verifyStatus, setVerifyStatus] = useState('idle'); // idle | verifying | error
  const [verifyErrorMsg, setVerifyErrorMsg] = useState('');
  const [verifiedVisitState, setVerifiedVisitState] = useState({
    stairwayId: null,
    status: 'idle', // idle | loading | available | unavailable | error
    details: null,
  });
  const [verificationReveal, setVerificationReveal] = useState(null);
  const [showVerificationPrivacyHint, setShowVerificationPrivacyHint] =
    useState(() => {
      try {
        return (
          localStorage.getItem(VERIFICATION_PRIVACY_HINT_DISMISSED_KEY) !==
          'true'
        );
      } catch {
        return true;
      }
    });

  const dismissVerificationPrivacyHint = () => {
    setShowVerificationPrivacyHint(false);
    try {
      localStorage.setItem(VERIFICATION_PRIVACY_HINT_DISMISSED_KEY, 'true');
    } catch {
      // The hint still dismisses for this session if storage is unavailable.
    }
  };
  const verifyFileInputRef = useRef(null);
  const verifiedVisitRequestIdRef = useRef(0);
  const verificationRevealTimersRef = useRef([]);

  const clearVerificationRevealTimers = useCallback(() => {
    verificationRevealTimersRef.current.forEach((timer) =>
      window.clearTimeout(timer)
    );
    verificationRevealTimersRef.current = [];
  }, []);

  const showVerificationReveal = useCallback(
    ({
      stairwayId,
      beforeDetails,
      beforeSpotted,
      beforeMethod,
      afterDetails,
      newVisitRecorded,
    }) => {
      clearVerificationRevealTimers();
      const justBecameMayor = didBecomeMayor(
        beforeDetails?.summary,
        afterDetails?.summary
      );
      const reveal = {
        stairwayId,
        phase: 'out',
        beforeDetails,
        beforeSpotted,
        beforeMethod,
        afterDetails,
        newVisitRecorded,
        justBecameMayor,
      };

      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setVerificationReveal({ ...reveal, phase: 'settled' });
        return;
      }

      setVerificationReveal(reveal);

      verificationRevealTimersRef.current = [
        window.setTimeout(() => {
          setVerificationReveal((current) =>
            current?.stairwayId === stairwayId
              ? { ...current, phase: 'in' }
              : current
          );
        }, 220),
        window.setTimeout(() => {
          setVerificationReveal((current) =>
            current?.stairwayId === stairwayId
              ? { ...current, phase: 'settled' }
              : current
          );
        }, 540),
      ];
    },
    [clearVerificationRevealTimers]
  );

  useEffect(
    () => () => clearVerificationRevealTimers(),
    [clearVerificationRevealTimers]
  );

  const refreshVerifiedVisitDetails = useCallback(
    async (stairwayId) => {
      const requestId = verifiedVisitRequestIdRef.current + 1;
      verifiedVisitRequestIdRef.current = requestId;
      setVerifiedVisitState({
        stairwayId,
        status: 'loading',
        details: null,
      });

      const result = await fetchVerifiedVisitDetails(stairwayId);
      if (verifiedVisitRequestIdRef.current !== requestId) return null;
      if (result.unavailable) {
        setVerifiedVisitState({
          stairwayId,
          status: 'unavailable',
          details: null,
        });
        return null;
      }
      if (result.error) {
        console.error('Verified visit history failed to load', result.error);
        setVerifiedVisitState({
          stairwayId,
          status: 'error',
          details: null,
        });
        return null;
      }

      setVerifiedVisitState({
        stairwayId,
        status: 'available',
        details: result.data,
      });
      return result.data;
    },
    [fetchVerifiedVisitDetails]
  );

  useEffect(() => {
    if (!selected?.id || !user) {
      verifiedVisitRequestIdRef.current += 1;
      setVerifiedVisitState({
        stairwayId: null,
        status: 'idle',
        details: null,
      });
      return;
    }
    refreshVerifiedVisitDetails(selected.id);
  }, [selected?.id, user?.id, refreshVerifiedVisitDetails]);

  useEffect(() => {
    setVerifyStatus('idle');
    setVerifyErrorMsg('');
    setCompletionMessage('');
    clearVerificationRevealTimers();
    setVerificationReveal(null);
  }, [selected?.id, clearVerificationRevealTimers]);

  async function completePhotoVerification(stairway) {
    const beforeDetails =
      verifiedVisitState.stairwayId === stairway.id
        ? verifiedVisitState.details
        : null;
    const beforeSpotted = checkedInIds.has(stairway.id);
    const beforeMethod = checkedInMethods.get(stairway.id);
    setVerifyStatus('verifying');
    setVerifyErrorMsg('');
    setCompletionMessage('');

    // The snapshot confirms that the camera flow completed, but it never
    // leaves the device. Only the successful GPS-verified check-in is saved.
    const {
      error,
      distance,
      visit,
      visitFeatureAvailable,
      locationErrorKind,
    } =
      await verifyWithPhoto(stairway);

    if (error) {
      setVerifyStatus('error');
      if (error === 'too-far') {
        const applicableThreshold = stairway.verification_radius_feet ?? 300;
        const isLine =
          stairway.verification_line_start_lat != null &&
          stairway.verification_line_end_lat != null;
        setVerifyErrorMsg(
          isLine
            ? `You're about ${distance}ft from the nearest point along this stretch -- get within ${applicableThreshold}ft to verify.`
            : `You're about ${distance}ft away -- get within ${applicableThreshold}ft of the stairway to verify.`
        );
      } else if (error === 'location-failed') {
        setVerifyErrorMsg(getLocationErrorMessage(locationErrorKind));
      } else if (error === 'no-geolocation') {
        setVerifyErrorMsg('Location services are not available in this browser.');
      } else {
        setVerifyErrorMsg('Something went wrong saving your verification. Try again?');
      }
    } else {
      setVerifyStatus('idle');
      const updatedIds = new Set(checkedInIds).add(stairway.id);
      checkAndAwardBadges(stairways, updatedIds, stairway.id)
        .then((newBadges) => {
          if (newBadges && newBadges.length > 0) setBadgeQueue(newBadges);
        })
        .catch((err) => console.error('Badge check failed', err));

      if (!visitFeatureAvailable) {
        // Safe compatibility state if the frontend reaches production before
        // the repeat-visit migration. Verification still succeeds and the
        // existing card remains open rather than disappearing unexpectedly.
        setCompletionMessage('Verified! ✓');
        return;
      }

      const refreshedDetails = await refreshVerifiedVisitDetails(stairway.id);
      const afterDetails =
        refreshedDetails || (visit ? { summary: visit, history: [] } : null);

      if (afterDetails?.summary) {
        showVerificationReveal({
          stairwayId: stairway.id,
          beforeDetails,
          beforeSpotted,
          beforeMethod,
          afterDetails,
          newVisitRecorded: visit?.new_visit_recorded !== false,
        });
      } else {
        setCompletionMessage('Verified! ✓');
      }
    }
  }

  async function handleNativePhotoVerification() {
    if (!selected) return;
    const stairway = selected;
    let temporaryPhoto;
    try {
      temporaryPhoto = await captureTemporaryVerificationPhoto();
      if (!temporaryPhoto) return;
      await completePhotoVerification(stairway);
    } catch (error) {
      setVerifyStatus('error');
      setVerifyErrorMsg(
        error?.message === 'camera-permission-denied'
          ? 'Camera access is needed for photo verification. You can enable it in your device settings.'
          : 'No photo was captured. Try again when you are ready.'
      );
    } finally {
      await temporaryPhoto?.discard();
    }
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!selected) return;

    if (!file) {
      setVerifyStatus('error');
      setVerifyErrorMsg(
        "No photo was captured -- try again and make sure to take or choose a photo."
      );
      return;
    }

    await completePhotoVerification(selected);
  }

  // --- "My Spotted Stairways" list state ---
  const [spottedSearch, setSpottedSearch] = useState('');
  const [spottedSort, setSpottedSort] = useState('recent'); // recent | neighborhood | rating | stair_count
  const [spottedNeighborhoodFilter, setSpottedNeighborhoodFilter] = useState('');

  // Close the info window whenever the list panel opens, so the two don't
  // overlap on screen.
  useEffect(() => {
    if (spottedListOpen) setSelected(null);
  }, [spottedListOpen]);

  const spottedStairways = useMemo(() => {
    let list = stairways.filter((s) => checkedInIds.has(s.id));

    if (spottedNeighborhoodFilter) {
      list = list.filter((s) => s.neighborhood === spottedNeighborhoodFilter);
    }

    if (spottedSearch.trim()) {
      const q = spottedSearch.trim().toLowerCase();
      list = list.filter((s) => s.description?.toLowerCase().includes(q));
    }

    const sorted = [...list];
    if (spottedSort === 'recent') {
      sorted.sort((a, b) => {
        const dateA = checkedInDates.get(a.id) || '';
        const dateB = checkedInDates.get(b.id) || '';
        return dateB.localeCompare(dateA); // newest first
      });
    } else if (spottedSort === 'neighborhood') {
      sorted.sort((a, b) =>
        (a.neighborhood || '').localeCompare(b.neighborhood || '')
      );
    } else if (spottedSort === 'rating') {
      sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    } else if (spottedSort === 'stair_count') {
      sorted.sort((a, b) => (b.stair_count ?? -1) - (a.stair_count ?? -1));
    }

    return sorted;
  }, [
    stairways,
    checkedInIds,
    checkedInDates,
    spottedSearch,
    spottedSort,
    spottedNeighborhoodFilter,
  ]);

  // Only offer neighborhoods the user has actually spotted something in,
  // rather than every neighborhood in the whole database -- keeps the
  // filter dropdown relevant to their own progress.
  const spottedNeighborhoods = useMemo(() => {
    const set = new Set(
      stairways
        .filter((s) => checkedInIds.has(s.id))
        .map((s) => s.neighborhood)
        .filter(Boolean)
    );
    return [...set].sort();
  }, [stairways, checkedInIds]);

  function jumpToSpottedStairway(stairway) {
    onCloseSpottedList?.();
    setSelected(stairway);
  }

  // --- "Spot a Stairway" state ---
  // spotLocation is null while the person still needs to pick where the
  // stairway is (tap the map, or use their current location). Once set,
  // we show the description form instead of the "tap the map" banner.
  const [spotLocation, setSpotLocation] = useState(null);
  const [spotDescription, setSpotDescription] = useState('');
  const [spotEmail, setSpotEmail] = useState('');
  const [spotStatus, setSpotStatus] = useState('idle'); // idle | submitting | success | error
  const [spotErrorMsg, setSpotErrorMsg] = useState('');

  // Reset everything when spot mode is turned off (whether from a
  // successful submit or hitting Cancel), and close any open stairway
  // info window the moment spot mode is turned on, so the two flows never
  // overlap on screen.
  useEffect(() => {
    if (!spotMode) {
      setSpotLocation(null);
      setSpotDescription('');
      setSpotEmail('');
      setSpotStatus('idle');
      setSpotErrorMsg('');
    } else {
      setSelected(null);
    }
  }, [spotMode]);

  // --- "Locate me" (general map button, separate from the Spot-a-Stairway
  // "use my location" flow above) ---
  const [myLocation, setMyLocation] = useState(null);
  // Separate from myLocation -- myLocation updates continuously (for the
  // dot + flare), but panTarget only updates once per "locate me" tap,
  // so the map centers/zooms once and then leaves scroll/zoom alone
  // instead of snapping back on every GPS update while you're walking.
  const [panTarget, setPanTarget] = useState(null);
  const [myHeading, setMyHeading] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [nearbyOpen, setNearbyOpen] = useState(false);
  const [nearbyStairways, setNearbyStairways] = useState([]);
  const [nearbyMessage, setNearbyMessage] = useState('');
  const [nearbyError, setNearbyError] = useState('');
  const [locatingNearby, setLocatingNearby] = useState(false);
  const locationWatchIdRef = useRef(null);
  const hasCenteredRef = useRef(false);

  // "Locate me" now tracks continuously (watchPosition) instead of taking
  // a single one-time fix (getCurrentPosition) -- the direction flare
  // needs live updates as you walk. GPS heading only comes through from
  // the browser while actually moving, so it's null when stationary;
  // that's why the flare only appears once you're walking, not the
  // instant you tap the button.
  async function handleLocateMe() {
    if (!supportsDeviceGeolocation()) {
      setLocationError('Location services are not available in this browser.');
      return;
    }
    setLocating(true);
    setLocationError('');

    if (locationWatchIdRef.current != null) {
      await clearDeviceLocationWatch(locationWatchIdRef.current);
    }
    hasCenteredRef.current = false;

    try {
      locationWatchIdRef.current = await startDeviceLocationWatch(
        { enableHighAccuracy: true, timeout: 10000 },
        (pos) => {
          const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          if (!isWithinBounds(loc)) {
            setMyLocation(null);
            setMyHeading(null);
            setLocating(false);
            showOutsideSanFranciscoMessage();
            if (locationWatchIdRef.current != null) {
              clearDeviceLocationWatch(locationWatchIdRef.current);
              locationWatchIdRef.current = null;
            }
            return;
          }
          setMyLocation(loc);
          if (!hasCenteredRef.current) {
            setPanTarget(loc);
            hasCenteredRef.current = true;
          }
          if (pos.coords.heading != null && !Number.isNaN(pos.coords.heading)) {
            setMyHeading(pos.coords.heading);
          }
          setLocating(false);
        },
        (locationFailure) => {
          setLocationError(getLocationErrorMessage(locationFailure));
          setLocating(false);
        }
      );
    } catch (locationFailure) {
      setLocationError(getLocationErrorMessage(locationFailure));
      setLocating(false);
    }
  }

  async function handleCheckInNearby() {
    setNearbyError('');
    setNearbyMessage('');

    if (!supportsDeviceGeolocation()) {
      setNearbyStairways([]);
      setNearbyError('Location services are not available in this browser.');
      setNearbyOpen(true);
      return;
    }

    setLocatingNearby(true);
    try {
      let location = myLocation;
      if (!location) {
        try {
          const pos = await getCurrentDevicePosition({
            enableHighAccuracy: true,
            timeout: 15000,
          });
          location = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
        } catch (locationFailure) {
          console.error('Nearby check-in location failed', locationFailure);
          setNearbyStairways([]);
          setNearbyError(getLocationErrorMessage(locationFailure));
          setNearbyOpen(true);
          return;
        }
      }
      if (!isWithinBounds(location)) {
        setNearbyOpen(false);
        showOutsideSanFranciscoMessage();
        return;
      }
      setMyLocation(location);
      setPanTarget(location);

      const sorted = stairways
        .map((stairway) => ({
          stairway,
          distanceMeters: distanceToStairwayMeters(location, stairway),
        }))
        .sort((a, b) => a.distanceMeters - b.distanceMeters);
      const withinCheckInRange = sorted.filter(
        (item) => item.distanceMeters <= GPS_THRESHOLD_METERS
      );

      if (withinCheckInRange.length === 1) {
        setSelected(withinCheckInRange[0].stairway);
        setNearbyOpen(false);
      } else {
        const nearbyResults =
          withinCheckInRange.length > 1 ? withinCheckInRange : sorted.slice(0, 5);

        // Photo fields are intentionally omitted from the 1,200+ row map
        // startup query. Load them only for this short nearby list so its
        // thumbnails remain useful without giving up the faster map load.
        let photoRows = [];
        try {
          const photoResult = await supabase
            .from('stairways')
            .select('id,direct_photo_url')
            .in('id', nearbyResults.map(({ stairway }) => stairway.id));
          if (photoResult.error) {
            console.warn('Nearby thumbnails unavailable', photoResult.error);
          } else {
            photoRows = photoResult.data || [];
          }
        } catch (photoError) {
          // Thumbnails are an enhancement, never a reason to block Check In.
          console.warn('Nearby thumbnails unavailable', photoError);
        }
        setNearbyStairways(
          addNearbyThumbnailPhotos(nearbyResults, photoRows)
        );
        setNearbyMessage(
          withinCheckInRange.length > 1
            ? 'Choose the stairway you are at.'
            : "Sorry, there aren't any stairways within 300 feet. Here are the closest ones."
        );
        setNearbyOpen(true);
      }
    } catch (nearbyFailure) {
      console.error('Nearby stairways failed to load', nearbyFailure);
      setNearbyStairways([]);
      setNearbyError(
        "Couldn't load nearby stairways. Please try again."
      );
      setNearbyOpen(true);
    } finally {
      setLocatingNearby(false);
    }
  }

  function selectNearbyStairway(stairway) {
    setNearbyOpen(false);
    setSelected(stairway);
  }

  // Stop watching when the map unmounts -- otherwise this would keep
  // requesting location updates (and draining battery) indefinitely.
  useEffect(() => {
    return () => {
      if (locationWatchIdRef.current != null) {
        clearDeviceLocationWatch(locationWatchIdRef.current);
      }
    };
  }, []);

  function handleUseMyLocation() {
    if (!supportsDeviceGeolocation()) {
      setSpotErrorMsg('Location services are not available in this browser.');
      return;
    }
    setSpotErrorMsg('');
    getCurrentDevicePosition({ enableHighAccuracy: true, timeout: 10000 })
      .then((pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        if (!isWithinBounds(location)) {
          showOutsideSanFranciscoMessage();
          return;
        }
        setSpotLocation({ ...location, source: 'gps' });
      })
      .catch((locationFailure) => {
        setSpotErrorMsg(
          `${getLocationErrorMessage(locationFailure)} You can also tap the map instead.`
        );
      });
  }

  async function handleSpotSubmit(e) {
    e.preventDefault();
    if (!spotDescription.trim() || !spotLocation) return;

    setSpotStatus('submitting');

    const { error } = await supabase.from('stairway_submissions').insert({
      description: spotDescription.trim(),
      latitude: spotLocation.lat,
      longitude: spotLocation.lng,
      location_source: spotLocation.source,
      contact_email: spotEmail.trim() || null,
      user_id: user?.id ?? null,
    });

    if (error) {
      setSpotStatus('error');
      setSpotErrorMsg(error.message);
    } else {
      setSpotStatus('success');
    }
  }

  // Which rating buckets are currently visible on the map. Starts with
  // everything shown, same as before this feature existed.
  const [visibleRatings, setVisibleRatings] = useState(new Set(ALL_RATING_KEYS));

  // Which neighborhoods are visible. Starts null ("not yet initialized") and
  // gets filled in with "everything" the moment the real data loads, since
  // we don't know the full neighborhood list until then.
  const [visibleNeighborhoods, setVisibleNeighborhoods] = useState(null);

  useEffect(() => {
    let isMounted = true;
    let isLoadingStairways = false;
    let lastLoadedAt = 0;
    setNewStairwayNotice(null);

    async function loadStairways() {
      if (isLoadingStairways) return;
      isLoadingStairways = true;
      // A single unbounded request silently caps out at Supabase's
      // default max-rows-per-request limit (1,000) -- with 1,100+
      // stairways, that meant the last ~100 or so never actually loaded,
      // even though nothing looked obviously wrong. Paging through in
      // batches, stopping only once a page comes back with fewer rows
      // than we asked for, guarantees we always get everything regardless
      // of how large the table grows or what the server's cap is set to.
      const PAGE_SIZE = 1000;
      let allRows = [];
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('stairways')
          .select(
            [
              'id',
              'description',
              'latitude',
              'longitude',
              'neighborhood',
              'rating',
              'stair_count',
              'updated_at',
              'verification_radius_feet',
              'verification_line_start_lat',
              'verification_line_start_lng',
              'verification_line_end_lat',
              'verification_line_end_lng',
            ].join(',')
          )
          .eq('active', true)
          .not('latitude', 'is', null)
          .not('longitude', 'is', null)
          .order('id', { ascending: true })
          .range(from, from + PAGE_SIZE - 1);

        if (error) {
          if (isMounted) {
            setError(error.message);
            setLoading(false);
          }
          isLoadingStairways = false;
          return;
        }

        const rows = data ?? [];
        allRows = allRows.concat(rows);

        if (rows.length < PAGE_SIZE) break; // reached the true end of the table
        from += PAGE_SIZE;
      }

      if (!isMounted) return;

      // Signed-out visitors never receive this account-specific notice. A
      // newly signed-in account establishes a quiet baseline on its first
      // visit; later visits compare IDs so removals cannot hide additions.
      try {
        const storageKey = knownStairwayIdsKey(user?.id);
        if (storageKey) {
          const notice = findNewStairwayNotice(
            allRows,
            localStorage.getItem(storageKey)
          );

          if (notice) {
            let stairwaysWithPhotos = notice.stairways;

            if (notice.addedCount > 1) {
              const { data: photoRows } = await supabase
                .from('stairways')
                .select('id,direct_photo_url')
                .in('id', notice.stairways.map((stairway) => stairway.id));
              const photosById = new Map(
                (photoRows ?? []).map((row) => [row.id, row.direct_photo_url])
              );
              stairwaysWithPhotos = notice.stairways.map((stairway) => ({
                ...stairway,
                direct_photo_url: photosById.get(stairway.id) || null,
              }));
            }

            setNewStairwayNotice({
              ...notice,
              stairway: stairwaysWithPhotos[0],
              stairways: stairwaysWithPhotos,
            });
          }

          localStorage.setItem(storageKey, serializeKnownStairwayIds(allRows));
        }
      } catch {
        // Private browsing/storage restrictions should never block the map.
      }

      setStairways(allRows);
      setError(null);
      setLoading(false);
      lastLoadedAt = Date.now();
      isLoadingStairways = false;
    }

    loadStairways();
    const refreshWhenVisible = () => {
      const isStale = Date.now() - lastLoadedAt > 60_000;
      if (document.visibilityState === 'visible' && isStale) loadStairways();
    };
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      isMounted = false;
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [user?.id]);

  const allNeighborhoods = useMemo(
    () =>
      [...new Set(stairways.map((s) => s.neighborhood).filter(Boolean))].sort(),
    [stairways]
  );

  // Once we know the real neighborhood list, default to showing all of them.
  useEffect(() => {
    if (allNeighborhoods.length > 0 && visibleNeighborhoods === null) {
      setVisibleNeighborhoods(new Set(allNeighborhoods));
    }
  }, [allNeighborhoods, visibleNeighborhoods]);

  const toggleRating = (key) => {
    setVisibleRatings((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const toggleNeighborhood = (name) => {
    setVisibleNeighborhoods((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const showAllNeighborhoods = () => setVisibleNeighborhoods(new Set(allNeighborhoods));
  const hideAllNeighborhoods = () => setVisibleNeighborhoods(new Set());

  const visibleStairways = useMemo(() => {
    if (visibleNeighborhoods === null) return stairways;
    return stairways.filter(
      (s) =>
        visibleRatings.has(ratingKey(s.rating)) &&
        (s.neighborhood == null || visibleNeighborhoods.has(s.neighborhood))
    );
  }, [stairways, visibleRatings, visibleNeighborhoods]);

  const [mapBounds, setMapBounds] = useState(null);
  const [, setIsMapInteracting] = useState(false);
  const [mapZoom, setMapZoom] = useState(12);

  // Further narrows visibleStairways (already filtered by rating/
  // neighborhood toggles) down to just what's within the current map
  // view. mapBounds is null until the map's first 'idle' event fires,
  // so everything renders normally on initial load.
  const culledStairways = useMemo(() => {
    if (!mapBounds) return visibleStairways;
    return visibleStairways.filter(
      (s) =>
        s.latitude <= mapBounds.north &&
        s.latitude >= mapBounds.south &&
        s.longitude <= mapBounds.east &&
        s.longitude >= mapBounds.west
    );
  }, [visibleStairways, mapBounds]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const mapRestrictionBounds = useMemo(
    () => getStairwayMapBounds(stairways),
    [stairways]
  );
  const selectedVisitState =
    verifiedVisitState.stairwayId === selected?.id
      ? verifiedVisitState
      : { status: 'idle', details: null };
  const selectedVerificationReveal =
    verificationReveal?.stairwayId === selected?.id
      ? verificationReveal
      : null;
  const showVerificationRevealResult =
    selectedVerificationReveal && selectedVerificationReveal.phase !== 'out';
  const normalVisitDetails =
    selectedVerificationReveal?.phase === 'out'
      ? selectedVerificationReveal.beforeDetails
      : selectedVisitState.details;
  const selectedVisitSummary = normalVisitDetails?.summary || null;
  const verifiedVisitsAvailable = selectedVisitState.status === 'available';
  const selectedDisplaySpotted =
    selectedVerificationReveal?.phase === 'out'
      ? selectedVerificationReveal.beforeSpotted
      : checkedInIds.has(selected?.id);
  const selectedDisplayMethod =
    selectedVerificationReveal?.phase === 'out'
      ? selectedVerificationReveal.beforeMethod
      : checkedInMethods.get(selected?.id);
  const selectedAlreadyVerified =
    selectedDisplayMethod === 'photo-verified';
  const selectedHasVisitHistory =
    Number(selectedVisitSummary?.total_visits || 0) > 0;
  const showVerificationAction =
    !selectedAlreadyVerified || verifiedVisitsAvailable;

  if (!apiKey) {
    return (
      <div className="status-banner">
        Missing VITE_GOOGLE_MAPS_API_KEY. Add it to your .env file (see
        .env.example) and restart the dev server.
      </div>
    );
  }

  return (
    <div className="map-container">
      {loading && <div className="status-banner">Loading stairways…</div>}
      {error && (
        <div className="status-banner">
          Couldn't load stairways: {error}
        </div>
      )}

      <APIProvider apiKey={apiKey}>
        <Map
          style={{ width: '100%', height: '100%' }}
          defaultCenter={SF_CENTER}
          defaultZoom={isMobileOrTablet() ? 12 : 11}
          minZoom={11}
          gestureHandling="greedy"
          disableDefaultUI
          fullscreenControl={false}
          zoomControl={false}
          streetViewControl={false}
          mapTypeControl={false}
          clickableIcons={false}
          onClick={(e) => {
            if (spotMode) {
              const latLng = e.detail?.latLng;
              if (latLng) {
                setSpotLocation({ lat: latLng.lat, lng: latLng.lng, source: 'pin' });
                setSpotErrorMsg('');
              }
              return;
            }
            setSelected(null);
          }}
          restriction={{
            latLngBounds: mapRestrictionBounds,
            strictBounds: true,
          }}
        >
          <MapHomeView sessionKey={user?.id ?? 'signed-out'} />
          <MapRecenter target={selected} />
          <PanToUserLocation target={panTarget} />
          <ViewportBoundsTracker
            onBoundsChange={setMapBounds}
            onInteractionChange={setIsMapInteracting}
            onZoomChange={setMapZoom}
          />
          {myLocation && (
            <>
              {/* Soft outer halo -- makes this read as "a location marker"
                  rather than just another colored dot, distinct in both
                  shape and color from every rating marker on the map. */}
              <Marker
                position={myLocation}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4b3ce0',
                  fillOpacity: 0.2,
                  strokeWeight: 0,
                  scale: 18,
                }}
                zIndex={997}
                clickable={false}
              />
              {/* Direction flare -- only appears once we have a real travel
                  heading (i.e. you're actually walking, not standing
                  still). rotation is degrees clockwise from north, same
                  convention GPS heading already uses, so no conversion
                  needed before passing it straight through. */}
              {myHeading != null && (
                <Marker
                  position={myLocation}
                  icon={{
                    path: 'M 0,0 L -0.6,-1.3 Q 0,-1.6 0.6,-1.3 Z',
                    fillColor: '#4b3ce0',
                    fillOpacity: 0.35,
                    strokeWeight: 0,
                    scale: 18,
                    rotation: myHeading,
                    anchor: new window.google.maps.Point(0, 0),
                  }}
                  zIndex={998}
                  clickable={false}
                />
              )}
              <Marker
                position={myLocation}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  fillColor: '#4b3ce0',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 2,
                  scale: 7,
                }}
                zIndex={999}
                clickable={false}
              />
            </>
          )}
          <StairwayMarkers
            stairways={culledStairways}
            checkedInIds={checkedInIds}
            checkedInMethods={checkedInMethods}
            spotMode={spotMode}
            onSelect={setSelected}
          />

          {spotMode && spotLocation && (
            <Marker
              position={{ lat: spotLocation.lat, lng: spotLocation.lng }}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                fillColor: '#e91e63',
                fillOpacity: 1,
                strokeColor: '#ffffff',
                strokeWeight: 2,
                scale: 10,
              }}
            />
          )}

          {selected && !spotMode && (
            <InfoWindow
              position={{ lat: selected.latitude, lng: selected.longitude }}
              zIndex={30}
              onCloseClick={() => setSelected(null)}
            >
              <div className="info-window">
                <button
                  className="info-window-close"
                  onClick={() => setSelected(null)}
                  aria-label="Close"
                >
                  ×
                </button>
                <h3 className="info-window-title">{selected.description}</h3>

                {(selected.rating != null || selected.stair_count != null) && (
                  <p className="info-window-meta">
                    {selected.rating != null && `Rating: ${selected.rating}`}
                    {selected.rating != null && selected.stair_count != null && ', '}
                    {selected.stair_count != null && `Steps: ${selected.stair_count}`}
                  </p>
                )}
                {selected.direct_photo_url ? (
                  <img
                    src={uncroppedPhotoUrl(selected.direct_photo_url)}
                    alt={selected.description}
                    referrerPolicy="no-referrer"
                  />
                ) : selected.photo_url ? (
                  <p>
                    <a href={selected.photo_url} target="_blank" rel="noreferrer">
                      View photo on Google Photos ↗
                    </a>
                  </p>
                ) : null}

                {completionMessage ? (
                  <div className="checkin-success" role="status">
                    {completionMessage}
                  </div>
                ) : user ? (
                  <>
                    <div className="verification-card-flip-stage">
                      <div
                        className={
                          'verification-card-lower' +
                          (selectedVerificationReveal
                            ? ` verification-card-lower--${selectedVerificationReveal.phase}`
                            : '')
                        }
                      >
                        {showVerificationRevealResult ? (
                          <div
                            className="verification-flip-result"
                            role="status"
                            aria-live="polite"
                          >
                            <div className="checkin-toggle checked checkin-toggle-status">
                              ✓ Spotted
                            </div>
                            {selectedVerificationReveal.newVisitRecorded ===
                              false && (
                              <p className="verified-already-counted">
                                ✓ Today’s verified visit was already counted.
                              </p>
                            )}
                            <VerifiedVisitPanel
                              details={selectedVerificationReveal.afterDetails}
                              loading={false}
                              justVerified={
                                selectedVerificationReveal.newVisitRecorded
                              }
                              justBecameMayor={
                                selectedVerificationReveal.justBecameMayor
                              }
                            />
                            {isMobileOrTablet() && (
                              <button
                                className="verify-photo-button"
                                type="button"
                                disabled
                              >
                                ✓ Today’s visit verified
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                            {selectedVisitState.status !== 'unavailable' && (
                              <VerifiedVisitPanel
                                details={normalVisitDetails}
                                loading={
                                  !selectedVerificationReveal &&
                                  selectedVisitState.status === 'loading'
                                }
                              />
                            )}

                            {selectedHasVisitHistory ? (
                              <div className="checkin-toggle checked checkin-toggle-status">
                                ✓ Spotted
                              </div>
                            ) : (
                              <button
                                className={
                                  'checkin-toggle' +
                                  (selectedDisplaySpotted ? ' checked' : '')
                                }
                                onClick={async () => {
                                  // A plain self-reported check-in un-toggles
                                  // freely. A legacy photo verification needs
                                  // confirmation because deleting it cannot be
                                  // undone. Once private visit history exists,
                                  // this becomes a durable Spotted status.
                                  const isVerified =
                                    checkedInMethods.get(selected.id) ===
                                    'photo-verified';
                                  if (isVerified) {
                                    setConfirmAction({
                                      message:
                                        "This will remove your verification for this stairway too -- there's no way to undo it. Continue?",
                                      onConfirm: () =>
                                        performCheckInToggle(selected),
                                    });
                                    return;
                                  }

                                  await performCheckInToggle(selected);
                                }}
                              >
                                {selectedDisplayMethod === 'photo-verified'
                                  ? '✓ Verified'
                                  : selectedDisplaySpotted
                                  ? '✓ Spotted'
                                  : 'Mark as spotted'}
                              </button>
                            )}

                            {showVerificationAction &&
                              (isMobileOrTablet() ? (
                                <button
                                  className="verify-photo-button"
                                  onClick={() =>
                                    isNativeApp()
                                      ? handleNativePhotoVerification()
                                      : verifyFileInputRef.current?.click()
                                  }
                                  disabled={
                                    verifyStatus === 'verifying' ||
                                    selectedVisitSummary?.visited_today
                                  }
                                >
                                  {verifyStatus === 'verifying'
                                    ? 'Verifying…'
                                    : verificationButtonLabel(
                                        selectedVisitSummary,
                                        selectedAlreadyVerified
                                      )}
                                </button>
                              ) : (
                                <p className="verify-desktop-hint">
                                  Open this app on mobile for photo verification.
                                </p>
                              ))}

                            {showVerificationAction &&
                              isMobileOrTablet() &&
                              showVerificationPrivacyHint && (
                                <div className="verify-privacy-hint">
                                  <span>
                                    Uses your location and a temporary camera
                                    photo. The photo is not saved or uploaded.
                                  </span>
                                  <button
                                    type="button"
                                    className="verify-privacy-hint-dismiss"
                                    onClick={dismissVerificationPrivacyHint}
                                    aria-label="Dismiss photo verification information"
                                  >
                                    ×
                                  </button>
                                </div>
                              )}

                            {verifyStatus === 'error' && (
                              <p className="verify-error">{verifyErrorMsg}</p>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    <input
                      ref={verifyFileInputRef}
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={handlePhotoSelected}
                    />
                  </>
                ) : (
                  <button
                    className="checkin-toggle signin-prompt"
                    onClick={() => onRequireSignIn?.()}
                  >
                    Sign in to save your spots
                  </button>
                )}

                <button
                  className="report-issue-link"
                  onClick={() => onReportIssue?.(selected)}
                >
                  Report an issue with this stairway
                </button>
              </div>
            </InfoWindow>
          )}
        </Map>

        {!spotMode && (
          <>
            <CheckInNearbyButton
              onClick={handleCheckInNearby}
              locating={locatingNearby}
              disabled={loading || stairways.length === 0}
            />
            <LocateMeButton onLocate={handleLocateMe} locating={locating} />
          </>
        )}
        {locationError && (
          <div
            style={{
              position: 'absolute',
              bottom: '212px',
              right: '10px',
              maxWidth: '220px',
              background: '#ffffff',
              boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
              borderRadius: '8px',
              padding: '8px 10px',
              fontSize: '13px',
              color: '#c0392b',
              zIndex: 5,
            }}
          >
            {locationError}
          </div>
        )}

        {locationBoundaryMessage && (
          <AlertDialog
            message={locationBoundaryMessage}
            onClose={() => setLocationBoundaryMessage('')}
          />
        )}

        <MapControlsPanel
          visibleRatings={visibleRatings}
          onToggleRating={toggleRating}
          allNeighborhoods={allNeighborhoods}
          visibleNeighborhoods={visibleNeighborhoods ?? new Set()}
          onToggleNeighborhood={toggleNeighborhood}
          onShowAllNeighborhoods={showAllNeighborhoods}
          onHideAllNeighborhoods={hideAllNeighborhoods}
        />

        {spotMode && !spotLocation && (
          <div className="spot-banner">
            <span>Tap the map to mark where you spotted a stairway</span>
            {spotErrorMsg && (
              <span className="spot-banner-error">{spotErrorMsg}</span>
            )}
            <div className="spot-banner-actions">
              <button type="button" onClick={handleUseMyLocation}>
                Use my location
              </button>
              <button type="button" onClick={onCancelSpot}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {spotMode && spotLocation && (
          <div className="spot-form-card">
            {spotStatus === 'success' ? (
              <div>
                <h2>Thanks!</h2>
                <p>I'll take a look and add it to the map if it checks out.</p>
                <button type="button" onClick={onCancelSpot}>
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleSpotSubmit}>
                <h2>Spot a Stairway</h2>
                <p className="modal-context">
                  {spotLocation.source === 'gps'
                    ? 'Using your current location.'
                    : 'Location: where you tapped on the map.'}{' '}
                  <button
                    type="button"
                    className="link-button"
                    onClick={() => setSpotLocation(null)}
                  >
                    Change location
                  </button>
                </p>

                <textarea
                  placeholder="Describe the stairway and where exactly it is (cross streets, landmarks, etc.)"
                  value={spotDescription}
                  onChange={(e) => setSpotDescription(e.target.value)}
                  rows={4}
                  required
                />

                <input
                  type="email"
                  placeholder="Your email (optional, if you'd like a reply)"
                  value={spotEmail}
                  onChange={(e) => setSpotEmail(e.target.value)}
                />

                {spotStatus === 'error' && (
                  <p className="modal-error">
                    Something went wrong: {spotErrorMsg}
                  </p>
                )}

                <div className="spot-form-buttons">
                  <button
                    type="button"
                    className="spot-form-cancel"
                    onClick={onCancelSpot}
                  >
                    Cancel
                  </button>
                  <button type="submit" disabled={spotStatus === 'submitting'}>
                    {spotStatus === 'submitting' ? 'Submitting…' : 'Submit'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </APIProvider>

      {spottedListOpen && (
        <div className="modal-backdrop" onClick={onCloseSpottedList}>
          <div
            className="modal-card spotted-list-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={onCloseSpottedList}
              aria-label="Close"
            >
              ×
            </button>

            <h2>My Spotted Stairways</h2>
            <p className="modal-context">
              {checkedInIds.size} / {stairways.length || '…'} spotted
            </p>

            <input
              type="text"
              className="spotted-search-input"
              placeholder="Search your spotted stairways…"
              value={spottedSearch}
              onChange={(e) => setSpottedSearch(e.target.value)}
            />

            <div className="spotted-controls">
              <select
                value={spottedSort}
                onChange={(e) => setSpottedSort(e.target.value)}
              >
                <option value="recent">Sort: Most recent</option>
                <option value="neighborhood">Sort: Neighborhood</option>
                <option value="rating">Sort: Rating</option>
                <option value="stair_count">Sort: Stair count</option>
              </select>

              <select
                value={spottedNeighborhoodFilter}
                onChange={(e) => setSpottedNeighborhoodFilter(e.target.value)}
              >
                <option value="">All neighborhoods</option>
                {spottedNeighborhoods.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>

            <div className="spotted-list">
              {spottedStairways.length === 0 ? (
                <p className="spotted-list-empty">
                  {checkedInIds.size === 0
                    ? "You haven't spotted any stairways yet -- tap a pin on the map and mark it as spotted!"
                    : 'No spotted stairways match your search/filter.'}
                </p>
              ) : (
                spottedStairways.map((s) => (
                  <button
                    key={s.id}
                    className="spotted-list-item"
                    onClick={() => jumpToSpottedStairway(s)}
                  >
                    <span className="spotted-list-item-desc">
                      {s.description || 'Stairway'}
                      {checkedInMethods.get(s.id) === 'photo-verified' && (
                        <span className="spotted-list-item-verified">
                          ★ Verified
                        </span>
                      )}
                    </span>
                    <span className="spotted-list-item-meta">
                      {s.neighborhood}
                      {s.rating != null ? ` · Rating ${s.rating}` : ''}
                      {s.stair_count != null ? ` · ${s.stair_count} stairs` : ''}
                    </span>
                    <span className="spotted-list-item-date">
                      {formatSpottedDate(checkedInDates.get(s.id))}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {nearbyOpen && (
        <div className="modal-backdrop" onClick={() => setNearbyOpen(false)}>
          <div
            className="modal-card nearby-stairways-card"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close"
              onClick={() => setNearbyOpen(false)}
              aria-label="Close"
            >
              ×
            </button>
            <h2>Stairways Near You</h2>
            {nearbyError ? (
              <p className="modal-error">{nearbyError}</p>
            ) : (
              <>
                <p className="modal-context">{nearbyMessage}</p>
                <div className="nearby-stairways-list">
                  {nearbyStairways.map(({ stairway, distanceMeters }) => (
                    <button
                      key={stairway.id}
                      type="button"
                      className="nearby-stairway-item"
                      onClick={() => selectNearbyStairway(stairway)}
                    >
                      {stairway.direct_photo_url ? (
                        <img
                          className="nearby-stairway-thumbnail"
                          src={uncroppedPhotoUrl(stairway.direct_photo_url)}
                          alt=""
                          loading="lazy"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span
                          className="nearby-stairway-thumbnail-placeholder"
                          aria-hidden="true"
                        >
                          ▟
                        </span>
                      )}
                      <span className="nearby-stairway-details">
                        <span className="nearby-stairway-description">
                          {stairway.description || 'Stairway'}
                        </span>
                        <span className="nearby-stairway-meta">
                          {formatNearbyDistance(distanceMeters)}
                          {stairway.neighborhood
                            ? ` · ${stairway.neighborhood}`
                            : ''}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {badgeQueue.length > 0 && (
        <BadgeEarnedModal badges={badgeQueue} onClose={() => setBadgeQueue([])} />
      )}

      {newStairwayNotice && (
        <NewStairwayModal
          stairwayCount={newStairwayNotice.stairwayCount}
          stairways={newStairwayNotice.stairways}
          addedCount={newStairwayNotice.addedCount}
          onDismiss={() => setNewStairwayNotice(null)}
          onShow={(stairway) => {
            setSelected(stairway);
            setNewStairwayNotice(null);
          }}
        />
      )}

      {confirmAction && (
        <ConfirmDialog
          message={confirmAction.message}
          onConfirm={() => {
            confirmAction.onConfirm();
            setConfirmAction(null);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
}
