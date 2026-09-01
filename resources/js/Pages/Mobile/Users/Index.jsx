import DesktopPage from '../../Users/Index';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileUsersIndex(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Users/Index" {...props} />; }
