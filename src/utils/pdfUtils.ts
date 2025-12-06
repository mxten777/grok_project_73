import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const generateApprovalPDF = async (approvalData: any, elementId?: string): Promise<Blob> => {
  const pdf = new jsPDF();

  // PDF 기본 설정
  pdf.setFont('helvetica');

  // 제목
  pdf.setFontSize(20);
  pdf.text('전자결재 문서', 105, 20, { align: 'center' });

  // 결재 정보
  pdf.setFontSize(12);
  let yPosition = 40;

  pdf.text(`문서 제목: ${approvalData.title}`, 20, yPosition);
  yPosition += 10;

  pdf.text(`신청자: ${approvalData.requester}`, 20, yPosition);
  yPosition += 10;

  pdf.text(`결재 유형: ${getApprovalTypeText(approvalData.type)}`, 20, yPosition);
  yPosition += 10;

  pdf.text(`신청일: ${formatDate(approvalData.createdAt)}`, 20, yPosition);
  yPosition += 10;

  pdf.text(`상태: ${getStatusText(approvalData.status)}`, 20, yPosition);
  yPosition += 20;

  // 결재 내용
  if (approvalData.content) {
    pdf.text('결재 내용:', 20, yPosition);
    yPosition += 10;

    const contentLines = pdf.splitTextToSize(approvalData.content, 170);
    pdf.text(contentLines, 20, yPosition);
    yPosition += contentLines.length * 5 + 10;
  }

  // 금액 정보 (있는 경우)
  if (approvalData.amount) {
    pdf.text(`금액: ${approvalData.amount}`, 20, yPosition);
    yPosition += 10;
  }

  // 결재 이력
  if (approvalData.history && approvalData.history.length > 0) {
    pdf.text('결재 이력:', 20, yPosition);
    yPosition += 10;

    approvalData.history.forEach((item: any, index: number) => {
      const actionText = item.action === 'approved' ? '승인' : '반려';
      const historyText = `${index + 1}. ${actionText} - ${formatDate(item.timestamp)}`;
      pdf.text(historyText, 30, yPosition);
      if (item.comment) {
        yPosition += 5;
        pdf.setFontSize(10);
        pdf.text(`사유: ${item.comment}`, 40, yPosition);
        pdf.setFontSize(12);
      }
      yPosition += 8;
    });
  }

  // HTML 요소를 캔버스로 변환하여 PDF에 추가 (선택사항)
  if (elementId) {
    try {
      const element = document.getElementById(elementId);
      if (element) {
        const canvas = await html2canvas(element);
        const imgData = canvas.toDataURL('image/png');
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, 10, 190, 0);
      }
    } catch (error) {
      console.error('HTML to PDF conversion failed:', error);
    }
  }

  return pdf.output('blob');
};

const getApprovalTypeText = (type: string): string => {
  const typeMap: { [key: string]: string } = {
    vacation: '휴가 신청서',
    expense: '지출 결의서',
    purchase: '구매 요청서',
    quote: '견적서 승인',
    contract: '계약서 승인',
  };
  return typeMap[type] || type;
};

const getStatusText = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    draft: '임시저장',
    submitted: '상신',
    reviewing: '검토중',
    approved: '승인',
    rejected: '반려',
  };
  return statusMap[status] || status;
};

const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const downloadPDF = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};