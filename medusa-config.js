const dotenv = require("dotenv");

let ENV_FILE_NAME = "";
switch (process.env.NODE_ENV) {
  case "production":
    ENV_FILE_NAME = ".env.production";
    break;
  case "staging":
    ENV_FILE_NAME = ".env.staging";
    break;
  case "test":
    ENV_FILE_NAME = ".env.test";
    break;
  case "development":
  default:
    ENV_FILE_NAME = ".env";
    break;
}

try {
  dotenv.config({ path: process.cwd() + "/" + ENV_FILE_NAME });
} catch (e) {}

// CORS when consuming Medusa from admin
const ADMIN_CORS =
  process.env.ADMIN_CORS || "http://localhost:7000,http://localhost:7001";

// CORS to avoid issues when consuming Medusa from a client
const STORE_CORS = process.env.STORE_CORS || "http://localhost:8000";

const DATABASE_URL =
  process.env.DATABASE_URL || "postgres://localhost/medusa-starter-default";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const plugins = [
  `medusa-fulfillment-manual`,
  `medusa-payment-manual`,
  {
    resolve: `@medusajs/file-local`,
    options: {
      upload_dir: "uploads",
    },
  },
  {
    resolve: "@medusajs/admin",
    /** @type {import('@medusajs/admin').PluginOptions} */
    options: {
      autoRebuild: true,
      develop: {
        open: process.env.OPEN_BROWSER !== "false",
      },
    },
  },
  // MeiliSearch plugin configuration with filterable attributes
  {
    resolve: "@rokmohar/medusa-plugin-meilisearch",
    options: {
      config: {
        host: process.env.MEILISEARCH_HOST || "http://127.0.0.1:7700",
        apiKey: process.env.MEILISEARCH_API_KEY,
      },
      settings: {
        products: {
          indexSettings: {
            // Configure filterable attributes for the products index
            filterableAttributes: [
              "id",
              "title",
              "description",
              "handle",
              "status",
              "created_at",
              "updated_at",
              "type.value",
              "collection.handle",
              "collection.title",
              "tags.value",
              "categories.handle",
              "categories.name",
              "variants.title",
              "variants.sku",
              "variants.prices.amount",
              "variants.prices.currency_code",
              "variants.options.value",
              "metadata.*",
            ],
            // Configure sortable attributes
            sortableAttributes: [
              "created_at",
              "updated_at",
              "title",
              "variants.prices.amount",
            ],
            // Configure searchable attributes with ranking
            searchableAttributes: [
              "title",
              "description",
              "variants.title",
              "variants.sku",
              "collection.title",
              "categories.name",
              "tags.value",
            ],
          },
          primaryKey: "id",
          transform: (product) => {
            return {
              id: product.id,
              title: product.title,
              description: product.description,
              handle: product.handle,
              status: product.status,
              created_at: new Date(product.created_at).getTime(),
              updated_at: new Date(product.updated_at).getTime(),
              type: product.type,
              collection: product.collection,
              tags: product.tags,
              categories: product.categories,
              variants: product.variants?.map((variant) => ({
                id: variant.id,
                title: variant.title,
                sku: variant.sku,
                prices: variant.prices?.map((price) => ({
                  amount: price.amount,
                  currency_code: price.currency_code,
                })),
                options: variant.options,
              })),
              metadata: product.metadata,
            };
          },
        },
      },
    },
  },
];

const modules = {
  /*eventBus: {
    resolve: "@medusajs/event-bus-redis",
    options: {
      redisUrl: REDIS_URL
    }
  },
  cacheService: {
    resolve: "@medusajs/cache-redis",
    options: {
      redisUrl: REDIS_URL
    }
  },*/
};

/** @type {import('@medusajs/medusa').ConfigModule["projectConfig"]} */
const projectConfig = {
  jwtSecret: process.env.JWT_SECRET,
  cookieSecret: process.env.COOKIE_SECRET,
  store_cors: STORE_CORS,
  database_url: DATABASE_URL,
  admin_cors: ADMIN_CORS,
  // Uncomment the following lines to enable REDIS
  // redis_url: REDIS_URL
};

/** @type {import('@medusajs/medusa').ConfigModule} */
module.exports = {
  projectConfig,
  plugins,
  modules,
};