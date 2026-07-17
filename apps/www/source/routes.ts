import { index, route, type RouteConfig } from '@react-router/dev/routes'

export default [
  index('pages/home/index.tsx'),
  route('about', 'pages/about/index.tsx'),
  route('pricing', 'pages/pricing/index.tsx'),
  route('privacy-policy', 'pages/privacy-policy/index.tsx'),
  route('api/track', 'pages/track/index.tsx'),
  route('*', 'pages/not-found/index.tsx'),
] satisfies RouteConfig
