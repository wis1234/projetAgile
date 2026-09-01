import DesktopPage from '../../Messages/Show';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileMessagesShow(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Messages/Show" {...props} />; }
