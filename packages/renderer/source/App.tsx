import { BrowserRouter, Routes, Route } from 'react-router-dom';
import type { ComponentType } from 'react';
import type { RouteItem, ClarifyConfig } from './types';

export type AppProps = {
  config: ClarifyConfig;
  routes: RouteItem[];
};

export function App({ config, routes }: AppProps) {
  return (
    <BrowserRouter basename={config.routeBase}>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={<route.component />} />
        ))}
      </Routes>
    </BrowserRouter>
  );
}
