/**
 * Data model for a court session entry in the judicial agenda.
 * Maps to the `sessions` table in SQLite / localStorage.
 */
export interface Session {
  id?: number;
  courtName: string; // اسم المحكمة
  circuit: string; // الدائرة
  caseNumber: string; // رقم الدعوى
  caseYear: number; // سنة الدعوى
  clientName: string; // اسم الموكل
  clientCapacity: string; // صفة الموكل
  opponentName: string; // اسم الخصم
  opponentCapacity: string; // صفة الخصم
  previousSession: string; // تفاصيل الجلسة السابقة
  decision: string; // القرار
  notes: string; // ملاحظات إضافية
  sessionDate: string; // ISO date string
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean; // تمييز البيانات التجريبية عن السجلات المحفوظة فعلياً
}

export function createSession(
  params: Omit<Session, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  }
): Session {
  const nowIso = new Date().toISOString();
  return {
    ...params,
    createdAt: params.createdAt ?? nowIso,
    updatedAt: params.updatedAt ?? nowIso,
    isDemo: params.isDemo ?? false,
  };
}

export function copySessionWith(
  original: Session,
  overrides: Partial<Session>
): Session {
  return {
    ...original,
    ...overrides,
    createdAt: overrides.createdAt ?? original.createdAt,
    updatedAt: overrides.updatedAt ?? new Date().toISOString(),
  };
}

export function sessionToMap(session: Session): Record<string, any> {
  return {
    id: session.id,
    court_name: session.courtName,
    circuit: session.circuit,
    case_number: session.caseNumber,
    case_year: session.caseYear,
    client_name: session.clientName,
    client_capacity: session.clientCapacity,
    opponent_name: session.opponentName,
    opponent_capacity: session.opponentCapacity,
    previous_session: session.previousSession,
    decision: session.decision,
    notes: session.notes,
    session_date: session.sessionDate,
    created_at: session.createdAt,
    updated_at: session.updatedAt,
    is_demo: session.isDemo ? 1 : 0,
  };
}

export function sessionFromMap(map: Record<string, any>): Session {
  return {
    id: map.id != null ? Number(map.id) : undefined,
    courtName: map.court_name ?? '',
    circuit: map.circuit ?? '',
    caseNumber: map.case_number ?? '',
    caseYear:
      map.case_year != null ? Number(map.case_year) : new Date().getFullYear(),
    clientName: map.client_name ?? '',
    clientCapacity: map.client_capacity ?? '',
    opponentName: map.opponent_name ?? '',
    opponentCapacity: map.opponent_capacity ?? '',
    previousSession: map.previous_session ?? '',
    decision: map.decision ?? '',
    notes: map.notes ?? '',
    sessionDate: map.session_date ?? new Date().toISOString(),
    createdAt: map.created_at ?? new Date().toISOString(),
    updatedAt: map.updated_at ?? new Date().toISOString(),
    isDemo: Number(map.is_demo) === 1,
  };
}
