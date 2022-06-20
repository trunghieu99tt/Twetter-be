/**
 * Interface được gửi lên
 */
export interface QueryPreOption {
  page?: string;
  limit?: string;
  cond?: string;
  sort?: string;
  order?: string;
  select?: string;
  custom?: string;
}

export interface QueryOption {
  select: { [field: string]: 0 | 1 };
  skip: number;
  limit: number;
  sort?: {
    [field: string]: -1 | 1;
  };
}

export interface QueryPostOption {
  conditions?: any;
  options?: QueryOption;
}
