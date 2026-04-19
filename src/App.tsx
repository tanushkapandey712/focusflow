import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./app/AppRouter";
import { FocusFlowDataProvider } from "./hooks/useFocusFlowData";

function App() {
  return (
    <FocusFlowDataProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </FocusFlowDataProvider>
  );
}

export default App;
