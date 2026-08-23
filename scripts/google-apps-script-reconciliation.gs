const SOURCE_SHEET_NAME = 'Merged';
const MINIMUM_SOURCE_ROWS = 1000;

function getSourceSheet_() {
  const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = spreadsheet.getSheetByName(SOURCE_SHEET_NAME);
  if (!sheet) {
    throw new Error(`Expected a sheet named "${SOURCE_SHEET_NAME}".`);
  }
  return sheet;
}

function getSourceIds_(sheet) {
  const headers = sheet
    .getRange(1, 1, 1, sheet.getLastColumn())
    .getValues()[0]
    .map((header) => String(header).trim());
  const idIndex = headers.indexOf('ID');
  if (idIndex < 0) throw new Error('Expected an ID column.');

  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];

  return [...new Set(
    sheet
      .getRange(2, idIndex + 1, lastRow - 1, 1)
      .getValues()
      .flat()
      .map((id) => String(id).trim())
      .filter(Boolean)
  )];
}

function callReconciliation_(config, activeIds, dryRun) {
  if (activeIds.length < MINIMUM_SOURCE_ROWS) {
    throw new Error(
      `Safety stop: the sheet supplied only ${activeIds.length} IDs.`
    );
  }

  const response = UrlFetchApp.fetch(
    `${config.url}/functions/v1/stairway-sync`,
    {
      method: 'post',
      contentType: 'application/json',
      headers: { 'x-sync-secret': config.syncSecret },
      payload: JSON.stringify({
        action: 'reconcile',
        activeIds,
        dryRun,
      }),
      muteHttpExceptions: true,
    }
  );

  const code = response.getResponseCode();
  const text = response.getContentText();
  if (code < 200 || code >= 300) {
    throw new Error(`Reconciliation returned ${code}: ${text}`);
  }
  return JSON.parse(text);
}

function reportReconciliation_(title, message) {
  Logger.log(message);
  try {
    SpreadsheetApp.getUi().alert(
      title,
      message,
      SpreadsheetApp.getUi().ButtonSet.OK
    );
  } catch (_error) {
    // Scheduled and editor-launched executions have no spreadsheet UI.
  }
}

function dryRunStairwayReconciliation() {
  const sheet = getSourceSheet_();
  ensureIdColumn_(sheet);
  const result = callReconciliation_(
    getConfig_(),
    getSourceIds_(sheet),
    true
  );
  const missing = result.missing || [];
  const details = missing.length
    ? missing.map((row) => `${row.description || '(no description)'} [${row.id}]`).join('\n')
    : 'No active stairways are missing from the sheet.';
  const summary = `Dry run only. Missing stairways: ${missing.length}\n\n${details}`;
  reportReconciliation_('Stairway reconciliation preview', summary);
}

function applyStairwayReconciliation() {
  const sheet = getSourceSheet_();
  ensureIdColumn_(sheet);
  const result = callReconciliation_(
    getConfig_(),
    getSourceIds_(sheet),
    false
  );
  const deactivated = result.deactivated || [];
  const summary = `Deactivated ${deactivated.length} stairway(s).`;
  reportReconciliation_('Reconciliation complete', summary);
}

function automaticStairwaySync() {
  const sheet = getSourceSheet_();
  const config = getConfig_();
  ensureIdColumn_(sheet);

  const rows = buildPayload_(sheet);
  if (rows.length < MINIMUM_SOURCE_ROWS) {
    throw new Error(`Safety stop: only ${rows.length} valid stairway rows were found.`);
  }

  for (let index = 0; index < rows.length; index += BATCH_SIZE) {
    upsertBatch_(config, rows.slice(index, index + BATCH_SIZE));
    Utilities.sleep(200);
  }

  const result = callReconciliation_(config, getSourceIds_(sheet), false);
  Logger.log(JSON.stringify({
    synced: rows.length,
    deactivated: (result.deactivated || []).length,
  }));
}

function installFiveMinuteStairwaySync() {
  ScriptApp.getProjectTriggers()
    .filter((trigger) => trigger.getHandlerFunction() === 'automaticStairwaySync')
    .forEach((trigger) => ScriptApp.deleteTrigger(trigger));

  ScriptApp.newTrigger('automaticStairwaySync')
    .timeBased()
    .everyMinutes(5)
    .create();

  Logger.log('Installed the five-minute automatic stairway sync trigger.');
}
