export const TECHNOLOGY_TAGS: Record<string, string[]> = {
  javascript: [
    'architecture', 'async', 'performance', 'security', 'debugging',
    'real-world-scenarios',
    'event-loop', 'closures', 'prototypes', 'scope', 'this', 'modules',
  ],
  typescript: [
    'architecture', 'async', 'performance', 'testing', 'debugging',
    'real-world-scenarios',
    'type-system', 'generics', 'utility-types', 'inference', 'api-design', 'strict-mode',
  ],
  python: [
    'oop', 'decorators', 'async', 'generators', 'list-comprehension',
    'data-structures', 'testing', 'packaging', 'concurrency', 'typing',
  ],
  java: [
    'architecture', 'async', 'data-access', 'performance', 'security',
    'testing', 'debugging', 'real-world-scenarios',
    'jvm', 'collections', 'concurrency', 'memory', 'api-design',
  ],
  csharp: [
    'architecture', 'async', 'data-access', 'performance', 'security',
    'testing', 'debugging', 'real-world-scenarios',
    'linq', 'dependency-injection', 'nullable', 'memory-management',
  ],
  go: [
    'goroutines', 'channels', 'interfaces', 'error-handling', 'concurrency',
    'packages', 'defer', 'context', 'modules', 'testing',
  ],
  php: [
    'oop', 'namespaces', 'composer', 'psr', 'testing',
    'security', 'traits', 'generators', 'type-system', 'performance',
  ],
  rust: [
    'ownership', 'borrowing', 'lifetimes', 'traits', 'concurrency',
    'memory-safety', 'error-handling', 'generics', 'iterators', 'async',
  ],
  ruby: [
    'blocks', 'metaprogramming', 'oop', 'gems', 'testing',
    'enumerable', 'modules', 'procs', 'rails', 'concurrency',
  ],
  kotlin: [
    'coroutines', 'null-safety', 'extension-functions', 'data-classes',
    'sealed-classes', 'delegation', 'flows', 'android', 'generics', 'collections',
  ],
  swift: [
    'optionals', 'arc', 'protocols', 'generics', 'concurrency',
    'swiftui', 'closures', 'error-handling', 'property-wrappers', 'actors',
  ],
  angular: [
    'architecture', 'state-management', 'async', 'routing', 'rendering',
    'performance', 'testing', 'security', 'debugging', 'real-world-scenarios',
    'signals', 'rxjs', 'change-detection', 'dependency-injection', 'ssr',
  ],
  react: [
    'architecture', 'state-management', 'async', 'rendering', 'performance',
    'testing', 'security', 'debugging', 'real-world-scenarios',
    'hooks', 'concurrent-rendering', 'server-components', 'react-query', 'forms',
  ],
  vue: [
    'architecture', 'state-management', 'async', 'routing', 'rendering',
    'performance', 'testing', 'debugging', 'real-world-scenarios',
    'composition-api', 'pinia', 'composables', 'reactivity', 'nuxt',
  ],
  nextjs: [
    'ssr', 'ssg', 'app-router', 'api-routes', 'performance',
    'data-fetching', 'middleware', 'server-actions', 'image-optimization', 'caching',
  ],
  svelte: [
    'reactivity', 'stores', 'transitions', 'actions', 'lifecycle',
    'slots', 'compiled', 'bindings', 'events', 'context',
  ],
  css: [
    'flexbox', 'grid', 'animations', 'responsive', 'bem',
    'variables', 'selectors', 'specificity', 'pseudo-elements', 'media-queries',
  ],
  html: [
    'semantic', 'accessibility', 'seo', 'forms', 'web-apis',
    'meta-tags', 'events', 'canvas', 'web-components', 'performance',
  ],
  nodejs: [
    'architecture', 'async', 'data-access', 'performance', 'security',
    'testing', 'debugging', 'real-world-scenarios',
    'event-loop', 'streams', 'express', 'worker-threads', 'caching',
  ],
  nestjs: [
    'dependency-injection', 'decorators', 'modules', 'guards', 'interceptors',
    'pipes', 'middleware', 'testing', 'microservices', 'authentication',
  ],
  dotnet: [
    'architecture', 'async', 'data-access', 'performance', 'security',
    'testing', 'debugging', 'real-world-scenarios',
    'aspnet-core', 'entity-framework', 'linq', 'middleware', 'dependency-injection',
  ],
  django: [
    'orm', 'views', 'templates', 'rest-framework', 'authentication',
    'middleware', 'signals', 'forms', 'admin', 'testing',
  ],
  laravel: [
    'eloquent', 'blade', 'artisan', 'queues', 'authentication',
    'middleware', 'events', 'testing', 'facades', 'routing',
  ],
  spring: [
    'ioc', 'dependency-injection', 'jpa', 'security', 'rest-api',
    'microservices', 'aop', 'testing', 'transactions', 'boot',
  ],
  sql: [
    'joins', 'indexes', 'transactions', 'queries', 'aggregations',
    'normalization', 'subqueries', 'views', 'stored-procedures', 'performance',
  ],
  mongodb: [
    'aggregations', 'indexes', 'schema-design', 'nosql', 'transactions',
    'replication', 'sharding', 'queries', 'data-modeling', 'atlas',
  ],
  redis: [
    'caching', 'pub-sub', 'data-structures', 'persistence', 'clustering',
    'transactions', 'streams', 'performance', 'expiration', 'patterns',
  ],
  graphql: [
    'queries', 'mutations', 'subscriptions', 'schema', 'resolvers',
    'authentication', 'directives', 'fragments', 'pagination', 'federation',
  ],
  docker: [
    'containers', 'images', 'dockerfile', 'compose', 'networking',
    'volumes', 'security', 'registry', 'multi-stage', 'performance',
  ],
  kubernetes: [
    'pods', 'services', 'deployments', 'configmaps', 'networking',
    'scaling', 'ingress', 'rbac', 'storage', 'helm',
  ],
  git: [
    'branching', 'merging', 'rebase', 'workflows', 'conflicts',
    'hooks', 'tags', 'cherry-pick', 'stash', 'history',
  ],
  flutter: [
    'widgets', 'state-management', 'dart', 'navigation', 'animations',
    'platform-channels', 'testing', 'performance', 'layouts', 'async',
  ],
  reactnative: [
    'native-modules', 'navigation', 'expo', 'performance', 'styling',
    'platform', 'animations', 'storage', 'testing', 'debugging',
  ],
  razor: [
    'rendering', 'security', 'testing', 'performance', 'debugging',
    'real-world-scenarios',
    'tag-helpers', 'forms', 'layout', 'server-rendering', 'blazor',
  ],
  winforms: [
    'rendering', 'async', 'performance', 'testing', 'security',
    'debugging', 'real-world-scenarios',
    'threading', 'data-binding', 'validation', 'desktop', 'legacy',
  ],
};
