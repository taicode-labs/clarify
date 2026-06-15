import { render } from '@clarify/renderer';
import { routes } from 'virtual:clarify-routes';
import { config } from 'virtual:clarify-config';
import './index.css';

render({ config, routes });
