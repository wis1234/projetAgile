import DesktopPage from '../../Files/Index';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileFilesIndex(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Files/Index" {...props} />; }
