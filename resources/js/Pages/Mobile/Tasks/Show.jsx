import DesktopPage from '../../Tasks/Show';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileTasksShow(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Tasks/Show" {...props} />; }
