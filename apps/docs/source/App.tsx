import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DocShell } from '@clarify/renderer';
import { routes } from 'virtual:clarify-routes';
import { config } from 'virtual:clarify-config';

export default function App() {
  return (
    <DocShell title={config.title}>
      <BrowserRouter basename={config.routeBase}>
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<route.component />}
            />
          ))}
        </Routes>
      </BrowserRouter>
    </DocShell>
  );
}
