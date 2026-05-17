import { Outlet } from 'react-router-dom';
import { TeamSidebar, MobileTabBar } from '../../../components/ui';

export default function TeamLayout() {
  return (
    <>
      <div className="max-w-[1320px] mx-auto px-4 sm:px-7 flex gap-8">
        <TeamSidebar />
        <div className="flex-1 min-w-0 py-5 sm:py-6 pb-24 lg:pb-6">
          <Outlet />
        </div>
      </div>
      <MobileTabBar />
    </>
  );
}
