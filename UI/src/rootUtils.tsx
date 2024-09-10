import { createRoot, Root } from "react-dom/client";

type RootStorage = {
  [key: string]: Root | null;
};

const roots: RootStorage = {};

export const renderWithRoot = (container: HTMLElement, component: React.ReactNode, rootKey: string) => {
  if (!roots[rootKey]) {
    roots[rootKey] = createRoot(container);
  }
  roots[rootKey]?.render(component);
};

export const unmountRoot = (rootKey: string) => {
  if (roots[rootKey]) {
    roots[rootKey]?.unmount();
    roots[rootKey] = null;
  }
};



