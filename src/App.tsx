import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AddCompanyCard } from '@/components/company/AddCompanyCard';
import LeadStateDiagram from '@/components/leads/LeadStateDiagram';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path='/'
          element={
            <div className='min-h-screen bg-white p-6 md:p-10'>
              <div className='mx-auto flex max-w-6xl justify-center'>
                <AddCompanyCard />
              </div>
            </div>
          }
        />
        <Route path='/states' element={<LeadStateDiagram />} />
      </Routes>
    </BrowserRouter>
  );
}
