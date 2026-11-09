import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { AparItem, InspectionRecord } from '../types';

export function exportAparListToExcel(apars: AparItem[], filename = 'Laporan_Inventaris_APAR_HSE_V-Belt') {
  const rows = apars.map((a, idx) => ({
    'No': idx + 1,
    'ID APAR': a.aparCode || a.id,
    'No. Inventaris': a.inventoryNumber,
    'Jenis Media': a.mediaType,
    'Kapasitas': a.capacity,
    'Merek': a.brand,
    'No. Seri Tabung': a.serialNumber || '-',
    'Gedung': a.building,
    'Area Produksi': a.area,
    'Posisi Pemasangan': a.locationDetail,
    'Tgl Pengadaan': a.procurementDate || '-',
    'Pengisian Terakhir': a.lastRefillDate || '-',
    'Jadwal Servis / Uji': a.expiryDate || '-',
    'Status Operasional': a.status === 'aktif' ? 'Aktif' : 'Tidak Aktif',
    'Kondisi Terakhir': a.lastInspectionStatus || 'Belum Diperiksa',
    'Tgl Inspeksi Terakhir': a.lastInspectionDate || '-',
    'Keterangan': a.notes || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Master APAR');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportInspectionsToExcel(inspections: InspectionRecord[], filename = 'Laporan_Inspeksi_Mingguan_APAR') {
  const rows = inspections.map((insp, idx) => ({
    'No': idx + 1,
    'ID Inspeksi': insp.id,
    'ID APAR': insp.aparCode || insp.aparId,
    'No. Inventaris': insp.inventoryNumber || '-',
    'Area / Lokasi': `${insp.building} - ${insp.area}`,
    'Detail Posisi': insp.location || '-',
    'Jenis Media': insp.mediaType,
    'Tgl Pemeriksaan': insp.inspectionDate,
    'Jam': insp.inspectionTime,
    'Minggu Ke': insp.weekNumber,
    'Tahun': insp.year,
    'Petugas': insp.inspectorName,
    'Status Hasil': insp.finalStatus,
    'Status Tindak Lanjut': insp.followUpStatus === 'resolved' ? 'Selesai Diperbaiki' :
                            insp.followUpStatus === 'in_progress' ? 'Sedang Diperbaiki' :
                            insp.followUpStatus === 'pending' ? 'Belum Ditindaklanjuti' : 'Tidak Ada Temuan',
    'Catatan Pemeriksaan': insp.notes || '-',
    'Rekomendasi Tindakan': insp.actionRecommendation || '-',
    'APAR Pengganti Sementara': insp.temporaryReplacementAparId || '-',
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Hasil Inspeksi');
  XLSX.writeFile(workbook, `${filename}_${new Date().toISOString().split('T')[0]}.xlsx`);
}

export function exportAreaComplianceToExcel(
  areaStats: { area: string; total: number; checked: number; good: number; needsAction: number; critical: number }[],
  weekNum: number
) {
  const rows = areaStats.map((item, idx) => {
    const percentage = item.total > 0 ? Math.round((item.checked / item.total) * 100) : 0;
    return {
      'No': idx + 1,
      'Area Pabrik V-Belt': item.area,
      'Total APAR': item.total,
      'Sudah Diperiksa': item.checked,
      'Belum Diperiksa': item.total - item.checked,
      'Kondisi Baik': item.good,
      'Perlu Tindakan': item.needsAction,
      'Tidak Layak': item.critical,
      'Tingkat Kepatuhan (%)': `${percentage}%`,
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, `Kepatuhan Mg-${weekNum}`);
  XLSX.writeFile(workbook, `Rekap_Kepatuhan_Inspeksi_Mg_${weekNum}_${new Date().getFullYear()}.xlsx`);
}

export function exportAparListToPdf(apars: AparItem[]) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // Official Letterhead (KOP SURAT)
  doc.setFillColor(185, 28, 28); // HSE Red
  doc.rect(0, 0, 297, 8, 'F');

  doc.setFontSize(15);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('PT V-BELT INDONESIA - DEPARTEMEN HEALTH, SAFETY & ENVIRONMENT (HSE)', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text('Kawasan Industri V-Belt Manufacturing Plant | Sistem Manajemen Alat Pemadam Api Ringan (APAR)', 14, 24);
  doc.text(`Dokumen Resmi: LAPORAN MASTER INVENTARIS APAR | Tanggal Cetak: ${new Date().toLocaleDateString('id-ID')}`, 14, 29);

  doc.setDrawColor(209, 213, 219);
  doc.line(14, 32, 283, 32);

  const head = [['No', 'ID APAR', 'No. Inv', 'Media & Kapasitas', 'Merek', 'Gedung & Area', 'Detail Posisi', 'Status', 'Kondisi']];
  const body = apars.map((a, i) => [
    i + 1,
    a.aparCode || a.id,
    a.inventoryNumber || '-',
    `${a.mediaType} (${a.capacity})`,
    a.brand,
    `${a.building}\n${a.area}`,
    a.locationDetail,
    a.status === 'aktif' ? 'Aktif' : 'Non-Aktif',
    a.lastInspectionStatus || 'Belum Diperiksa',
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 36,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
  });

  // Footer & Signatures
  const finalY = (doc as any).lastAutoTable?.finalY || 160;
  if (finalY + 35 < 200) {
    doc.setFontSize(9);
    doc.setTextColor(55, 65, 81);
    doc.text('Dibuat oleh,', 20, finalY + 12);
    doc.text('Petugas Inspeksi HSE', 20, finalY + 16);
    doc.text('( .................................... )', 20, finalY + 32);

    doc.text('Mengetahui / Menyetujui,', 220, finalY + 12);
    doc.text('HSE Manager & Safety Officer', 220, finalY + 16);
    doc.text('( .................................... )', 220, finalY + 32);
  }

  doc.save(`Laporan_Master_APAR_${new Date().toISOString().split('T')[0]}.pdf`);
}

export function exportWeeklyInspectionToPdf(
  inspections: InspectionRecord[],
  weekNum: number,
  year: number
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Official Letterhead
  doc.setFillColor(185, 28, 28);
  doc.rect(0, 0, 210, 6, 'F');

  doc.setFontSize(13);
  doc.setTextColor(31, 41, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('PT V-BELT INDONESIA - HSE DEPARTMENT', 14, 15);

  doc.setFontSize(11);
  doc.setTextColor(185, 28, 28);
  doc.text(`LAPORAN INSPEKSI RUTIN MINGGUAN APAR (MINGGU KE-${weekNum} TAHUN ${year})`, 14, 21);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(107, 114, 128);
  doc.text(`Periode: Minggu ${weekNum} / ${year} | Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 26);
  doc.line(14, 29, 196, 29);

  const head = [['No', 'ID APAR', 'Area & Lokasi', 'Media', 'Tgl / Jam', 'Petugas', 'Hasil', 'Tindak Lanjut']];
  const body = inspections.map((insp, i) => [
    i + 1,
    insp.aparCode || insp.aparId,
    `${insp.area}\n${insp.location || ''}`,
    insp.mediaType,
    `${insp.inspectionDate}\n${insp.inspectionTime}`,
    insp.inspectorName,
    insp.finalStatus,
    insp.followUpStatus === 'resolved' ? 'Selesai' :
    insp.followUpStatus === 'in_progress' ? 'Proses' :
    insp.followUpStatus === 'pending' ? 'Perlu Tindakan' : 'Normal',
  ]);

  autoTable(doc, {
    head,
    body,
    startY: 33,
    styles: { fontSize: 7.5, cellPadding: 2 },
    headStyles: { fillColor: [31, 41, 55], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [249, 250, 251] },
    margin: { left: 14, right: 14 },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 6) {
        if (data.cell.raw === 'TIDAK LAYAK') {
          data.cell.styles.textColor = [220, 38, 38];
          data.cell.styles.fontStyle = 'bold';
        } else if (data.cell.raw === 'PERLU TINDAKAN') {
          data.cell.styles.textColor = [202, 138, 4];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [22, 163, 74];
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable?.finalY || 220;
  if (finalY + 40 < 285) {
    doc.setFontSize(8.5);
    doc.setTextColor(55, 65, 81);
    doc.text('Diperiksa oleh:', 20, finalY + 12);
    doc.text('HSE Inspector Lapangan', 20, finalY + 16);
    doc.text('( .................................... )', 20, finalY + 32);

    doc.text('Diverifikasi oleh:', 140, finalY + 12);
    doc.text('HSE Manager & Safety Officer', 140, finalY + 16);
    doc.text('( .................................... )', 140, finalY + 32);
  }

  doc.save(`Laporan_Inspeksi_APAR_Minggu_${weekNum}_${year}.pdf`);
}
