import DesktopPage from '../../Files/Preview';
import MobileSectionAdapter from '@/Components/MobileSectionAdapter';
export default function MobileFilesPreview(props) { return <MobileSectionAdapter PageComponent={DesktopPage} pageName="Files/Preview" {...props} />; }
