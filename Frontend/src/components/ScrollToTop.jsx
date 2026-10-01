import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  useEffect(() => {
    // If it's a PUSH or REPLACE action (clicking a link), scroll to top.
    // If it's a POP action (back/forward browser buttons), do nothing so 
    // the browser's native scroll restoration can work.
    if (navType !== "POP") {
      window.scrollTo(0, 0);
    }
  }, [pathname, navType]);

  return null;
}
