// React Router 7 expects encoding APIs that CRA's older jsdom does not provide.
import { TextDecoder, TextEncoder } from 'util';
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;
