export const ESCALATION_FLOW = ["level1", "hod", "cfo"];

export const getNextEscalationLevel = (currentLevel) => {
  const idx = ESCALATION_FLOW.indexOf(currentLevel);
  if (idx === -1 || idx === ESCALATION_FLOW.length - 1) {
    return null; // no further escalation
  }
  return ESCALATION_FLOW[idx + 1];
};
