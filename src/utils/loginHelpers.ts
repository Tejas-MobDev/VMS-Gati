import type { LoginResponseData } from '../types/api';

const DIRECT_ID_FIELDS = [
  'ID',
  'EmployeeID',
  'EmpID',
  'UserID',
  'EmployeeId',
  'EmpId',
  'RMID',
  'LoggedInEmployeeID',
  'LoggedInEmployeeId',
] as const;

const NESTED_OBJECT_FIELDS = [
  'objEmployee',
  'Employee',
  'User',
  'LoginEmployee',
  'EmployeeDetails',
] as const;

function isValidId(value: unknown): value is string | number {
  return (
    value != null &&
    value !== '' &&
    value !== 0 &&
    value !== '0' &&
    value !== 'null' &&
    value !== 'undefined'
  );
}

export function extractEmployeeIdFromLogin(data: unknown): string | null {
  if (data == null) {
    return null;
  }

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'number' && isValidId(item)) {
        return String(item);
      }
      if (typeof item === 'string' && isValidId(item)) {
        return item;
      }
      if (item && typeof item === 'object') {
        const nestedId = extractEmployeeIdFromLogin(item);
        if (nestedId) {
          return nestedId;
        }
      }
    }
    return null;
  }

  if (typeof data !== 'object') {
    return null;
  }

  const record = data as Record<string, unknown>;

  for (const field of DIRECT_ID_FIELDS) {
    const value = record[field];
    if (isValidId(value)) {
      return String(value);
    }
  }

  for (const field of NESTED_OBJECT_FIELDS) {
    const nested = record[field];
    if (nested && typeof nested === 'object') {
      const nestedId = extractEmployeeIdFromLogin(nested);
      if (nestedId) {
        return nestedId;
      }
    }
  }

  // Tuple-style .NET serialization (m_Item1, m_Item2, ...)
  for (const [key, value] of Object.entries(record)) {
    if (key.startsWith('m_Item') && isValidId(value)) {
      return String(value);
    }
  }

  return null;
}

export function extractEmployeeIdFromLoginResponse(
  data: LoginResponseData,
  response?: Record<string, unknown>,
): string | null {
  return (
    extractEmployeeIdFromLogin(data) ??
    (response ? extractEmployeeIdFromLogin(response) : null)
  );
}
