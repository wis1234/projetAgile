import DesktopPage from '../../Activities/Index';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileActivitiesIndex(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Activities/Index" {...props} />; }
