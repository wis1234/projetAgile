import DesktopPage from '../../Messages/Index';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileMessagesIndex(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Messages/Index" {...props} />; }
