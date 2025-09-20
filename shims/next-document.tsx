// Shim robusto para `next/document`.
// - Evita el error "Html should not be imported outside of pages/_document".
// - Provee un Document de reemplazo por si el runtime legacy lo usa en /404 o /500.

import * as React from "react";

export const Html: React.FC<React.HTMLAttributes<HTMLHtmlElement>> = (props) => (
  <html {...props} />
);
export const Head: React.FC<React.PropsWithChildren<{}>> = ({ children }) => (
  <head>{children}</head>
);
export const Main: React.FC = () => <div id="__next_main__" />;
export const NextScript: React.FC = () => <div id="__next_scripts__" />;

// Default export para compatibilidad con el runtime de Pages Router.
// Implementamos un Document mínimo e inofensivo.
export default class Document extends React.Component {
  static async getInitialProps(_: any) {
    return { styles: [] };
  }
  render() {
    return (
      <Html>
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}
