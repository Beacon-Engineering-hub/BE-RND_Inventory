import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Items from './pages/Items';
import ItemDetail from './pages/ItemDetail';
import Outgoing from './pages/Outgoing';
import BorrowRequest from './pages/BorrowRequest';
import BorrowApproval from './pages/BorrowApproval';
import BorrowHistory from './pages/BorrowHistory';
import Settings from './pages/Settings';

export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/items" element={<Items />} />
            <Route path="/items/:id" element={<ItemDetail />} />
            <Route path="/outgoing" element={<Outgoing />} />
            <Route path="/borrow/request" element={<BorrowRequest />} />
            <Route path="/borrow/approval" element={<BorrowApproval />} />
            <Route path="/borrow/history" element={<BorrowHistory />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </Layout>
      </ToastProvider>
    </BrowserRouter>
  );
}
