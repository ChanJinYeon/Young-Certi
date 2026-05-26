import { useMemo, useState } from "react";

export function useLocalSession() {
  const generated = useMemo(() => crypto.randomUUID(), []);
  const [state] = useState(() => {
    const existing = localStorage.getItem("young-certi/sessionId");
    if (existing) return { sessionId: existing, isEphemeral: false };
    try {
      localStorage.setItem("young-certi/sessionId", generated);
      return { sessionId: generated, isEphemeral: false };
    } catch {
      return { sessionId: generated, isEphemeral: true };
    }
  });

  return {
    sessionId: state.sessionId,
    isEphemeral: state.isEphemeral,
  };
}
