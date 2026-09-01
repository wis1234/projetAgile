import DesktopPage from '../../Users/Show';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileUsersShow(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Users/Show" {...props} />; }
