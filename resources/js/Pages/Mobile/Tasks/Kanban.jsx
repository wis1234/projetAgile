import DesktopPage from '../../Tasks/Kanban';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileTasksKanban(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Tasks/Kanban" {...props} />; }
