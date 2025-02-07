import {
  createFetcher,
  FetcherType,
} from "@supabase-cache-helpers/postgrest-fetcher";
import {
  PostgrestFilterBuilder,
  PostgrestError,
  PostgrestResponse,
  PostgrestTransformBuilder,
} from "@supabase/postgrest-js";
import { GenericSchema } from "@supabase/postgrest-js/dist/module/types";
import useSWR, { SWRConfiguration, SWRResponse } from "swr";

import { middleware } from "../lib";

/**
 * Perform a postgrest query
 * @param query
 * @param mode
 * @param config
 */
function useQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  query:
    | PostgrestFilterBuilder<Schema, Table, Result>
    | PostgrestTransformBuilder<Schema, Table, Result>
    | null,
  mode: "single",
  config?: SWRConfiguration
): SWRResponse<Result, PostgrestError>;
function useQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  query:
    | PostgrestFilterBuilder<Schema, Table, Result>
    | PostgrestTransformBuilder<Schema, Table, Result>
    | null,
  mode: "maybeSingle",
  config?: SWRConfiguration
): SWRResponse<Result | undefined, PostgrestError>;
function useQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  query:
    | PostgrestFilterBuilder<Schema, Table, Result>
    | PostgrestTransformBuilder<Schema, Table, Result>
    | null,
  mode: "multiple",
  config?: SWRConfiguration
): SWRResponse<Result[], PostgrestError> &
  Pick<PostgrestResponse<Result[]>, "count">;
function useQuery<
  Schema extends GenericSchema,
  Table extends Record<string, unknown>,
  Result
>(
  query:
    | PostgrestFilterBuilder<Schema, Table, Result>
    | PostgrestTransformBuilder<Schema, Table, Result>
    | null,
  mode: FetcherType,
  config?: SWRConfiguration
): SWRResponse<Result | Result[], PostgrestError> &
  Partial<Pick<PostgrestResponse<Result | Result[]>, "count">> {
  const { data: res, ...rest } = useSWR(
    query,
    createFetcher<Schema, Table, Result>(mode),
    {
      ...config,
      use: [...(config?.use ?? []), middleware],
    }
  );
  if (!res) {
    return { data: res, ...rest };
  }
  const { data, count } = res;
  return { data, count, ...rest };
}

export { useQuery };
