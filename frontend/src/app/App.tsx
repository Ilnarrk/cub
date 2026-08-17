import { Routes, Route } from "react-router-dom";
import { ReviewColorsPage } from "@pages/ReviewColors";
import { SolvingPage } from "@pages/Solving";
import { Layout } from "@shared/ui/Layout";

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<ReviewColorsPage />} />
        <Route path="/review" element={<ReviewColorsPage />} />
        <Route path="/solve" element={<SolvingPage />} />
      </Routes>
    </Layout>
  );
}

export default App;
