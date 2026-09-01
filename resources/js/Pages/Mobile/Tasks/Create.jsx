import DesktopPage from '../../Tasks/Create';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileTasksCreate(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Tasks/Create" {...props} />; }
