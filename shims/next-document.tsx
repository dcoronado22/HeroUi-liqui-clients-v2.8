// Shim seguro para evitar el error de Next cuando alguna lib usa `next/document` fuera de _document.

import * as React from "react";

// Devolvemos tags nativos o nulos para que no truene en runtime.
export const Html: React.FC<React.HTMLAttributes<HTMLHtmlElement>> = (props) => <html {...props} />;
export const Head: React.FC<React.PropsWithChildren<{}>> = ({ children }) => <head>{children}</head>;
export const Main: React.FC = () => null;
export const NextScript: React.FC = () => null;

export default {};
