export interface kvError {
  ok: false;
  error: string;
  request_id: string;
}

export interface kvPush {
  type: "push";
  key: string;
  // eslint-disable-next-line camelcase
  new_value: string;
}

export interface kvGenericResponse<T> {
  ok: true;
  type: "response";
  request_id: string;
  data: T;
}

export interface kvEmptyResponse {
  ok: true;
  type: "response";
  request_id: string;
}

export interface kvGet {
  command: "kget";
  request_id: string;
  data: { key: string };
}

export interface kvGetBulk {
  command: "kget-bulk";
  request_id: string;
  data: { keys: string[] };
}

export interface kvGetAll {
  command: "kget-all";
  request_id: string;
  data: { prefix: string };
}

export interface kvSet {
  command: "kset";
  request_id: string;
  data: { key: string; data: string };
}

export interface kvSetBulk {
  command: "kset-bulk";
  request_id: string;
  data: Record<string, string>;
}

export interface kvSubscribeKey {
  command: "ksub";
  request_id: string;
  data: { key: string };
}

export interface kvUnsubscribeKey {
  command: "kunsub";
  request_id: string;
  data: { key: string };
}

export interface kvSubscribePrefix {
  command: "ksub-prefix";
  request_id: string;
  data: { prefix: string };
}

export interface kvUnsubscribePrefix {
  command: "kunsub-prefix";
  request_id: string;
  data: { prefix: string };
}

export interface kvVersion {
  command: "version";
  request_id: string;
}

export interface kvInternalClientID {
  command: "_uid";
  request_id: string;
}

export interface kvKeyList {
  command: "klist";
  request_id: string;
  data: { prefix?: string };
}

export interface kvLogin {
  command: "klogin";
  request_id: string;
}

export interface kvAuth {
  command: "kauth";
  request_id: string;
  data: {
    hash: string;
  };
}

export interface kvDelete {
  command: "kdel";
  request_id: string;
  data: { key: string };
}

export type KilovoltResponse =
  | kvGenericResponse<string>
  | kvGenericResponse<Record<string, string>>
  | kvEmptyResponse;
