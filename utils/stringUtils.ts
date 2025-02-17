export default function getFileNameFromUrl(fileUrl: any): string {
  const fileName =
    typeof fileUrl === 'string' && fileUrl.includes('/')
      ? fileUrl.split('/').pop() || ''
      : '';
  console.log('fileName:', fileName);
  return fileName;
}
