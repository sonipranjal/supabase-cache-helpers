import { PostgrestTransformBuilder } from "@supabase/postgrest-js";
import { GenericSchema } from "@supabase/supabase-js/dist/module/lib/types";

export type PostgrestPaginationFetcher<Type, Args extends any[]> = (
  ...args: Args
) => Promise<Type[] | null>;

export type PostgrestPaginationKeyDecoder<Args extends any[]> = (
  ...args: Args
) => {
  limit?: number;
  offset?: number;
};

export const createPaginationFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args extends any[]
>(
  query: PostgrestTransformBuilder<Schema, Row, Result> | null,
  decode: PostgrestPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestPaginationFetcher<Result, Args> | null => {
  if (!query) return null;
  return async (...args) => {
    const decodedKey = decode(...args);
    const limit = (decodedKey.limit ?? pageSize) - 1;
    const offset = decodedKey.offset ?? 0;
    const { data } = await query.range(offset, offset + limit).throwOnError();
    return data;
  };
};

export const createPaginationHasMoreFetcher = <
  Schema extends GenericSchema,
  Row extends Record<string, unknown>,
  Result,
  Args extends any[]
>(
  query: PostgrestTransformBuilder<Schema, Row, Result> | null,
  decode: PostgrestPaginationKeyDecoder<Args>,
  pageSize: number
): PostgrestPaginationFetcher<Result | { hasMore: true }, Args> | null => {
  if (!query) return null;
  return async (...args) => {
    const decodedKey = decode(...args);
    const limit = decodedKey.limit ?? pageSize;
    const offset = decodedKey.offset ?? 0;
    const result = await query.range(offset, offset + limit).throwOnError();
    const data: Awaited<
      ReturnType<PostgrestPaginationFetcher<Result | { hasMore: true }, Args>>
    > | null = result.data;
    if (data && data.length === pageSize + 1) {
      data[data.length - 1] = { hasMore: true };
    }
    return data;
  };
};
