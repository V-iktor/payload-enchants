import type { Plugin } from 'payload';

import { applySelect } from './applySelect';
import { withDefaultFields } from './withDefaultFields';

export { applySelect };

const sanitizeSelect = (select: unknown) =>
  Array.isArray(select) && select.every((each) => typeof each === 'string')
    ? (select as string[])
    : undefined;

export const fieldsSelect =
  ({
    sanitizeExternals = false,
  }: { sanitizeExternals?: boolean; selectIDByDefault?: boolean } = {}): Plugin =>
  (config) => {
    return {
      ...config,
      collections: (config.collections ?? []).map((collection) => {
        return {
          ...collection,
          hooks: {
            ...(collection.hooks ?? {}),
            afterOperation: [
              ...(collection.hooks?.afterOperation ?? []),
              ({ args, operation, result }) => {
                if (typeof (args as any).currentDepth === 'number') return result;

                const select = sanitizeSelect((args as any)?.select);

                if (operation === 'find') {
                  const updated = JSON.parse(JSON.stringify(result));

                  updated.docs.forEach((data: any) => {
                    applySelect({
                      collections: config.collections ?? [],
                      data,
                      fields: withDefaultFields(collection),
                      sanitizeExternals,
                      select,
                    });
                  });

                  return updated;
                } else if (operation === 'findByID') {
                  const updated = JSON.parse(JSON.stringify(result));

                  applySelect({
                    collections: config.collections ?? [],
                    data: updated,
                    fields: withDefaultFields(collection),
                    sanitizeExternals,
                    select,
                  });

                  return updated;
                }

                return result;
              },
            ],
            beforeOperation: [
              ...(collection.hooks?.beforeOperation ?? []),
              ({ args, operation, req }) => {
                if (operation === 'read') {
                  if (req.context.select) {
                    args.select = req.context.select;
                    delete req.context['select'];
                  } else if (req.query.select) {
                    args.select = req.query.select;
                    delete req.query['select'];
                  }
                }

                return args;
              },
            ],
          },
        };
      }),
      globals: (config.globals ?? []).map((global) => {
        return {
          ...global,
          hooks: {
            ...global.hooks,
            afterRead: [
              ...(global.hooks?.afterRead ?? []),
              (args) => {
                const select = sanitizeSelect(args.context.select || args.req.query.select);

                applySelect({
                  collections: config.collections ?? [],
                  data: args.doc,
                  fields: global.fields,
                  sanitizeExternals,
                  select,
                });
              },
            ],
          },
        };
      }),
    };
  };
