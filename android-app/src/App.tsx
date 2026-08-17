import { useEffect } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { App as NativeApp } from "@capacitor/app";
import { StatusBar, Style } from "@capacitor/status-bar";
import { ReviewPage } from "@/pages/Review";
import { SolvePage } from "@/pages/Solve";
import { Layout } from "@/components/Layout";

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    void StatusBar.setStyle({ style: Style.Light });
    void StatusBar.setBackgroundColor({ color: "#08090c" });
    const listener = NativeApp.addListener("backButton", () => {
      if (document.fullscreenElement) {
        void document.exitFullscreen();
        return;
      }
      const event = new Event("cubesolver:back", { cancelable: true });
      window.dispatchEvent(event);
      if (event.defaultPrevented) return;
      if (location.pathname === "/solve") navigate("/");
      else void NativeApp.exitApp();
    });
    return () => {
      void listener.then((handle) => handle.remove());
    };
  }, [location.pathname, navigate]);

  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ReviewPage />} />
        <Route path="/solve" element={<SolvePage />} />
      </Routes>
    </Layout>
  );
}
