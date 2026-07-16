'use client';

import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { processExcelImport } from '@/actions/import';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';
import { useDictionary } from '@/components/dictionary-provider';

export function ImportManager() {
  const dict: any = useDictionary();
  const [step, setStep] = useState<'UPLOAD' | 'PREVIEW' | 'IMPORTING' | 'SUMMARY'>('UPLOAD');
  
  // Upload State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Parse State
  const [rawData, setRawData] = useState<any[]>([]);
  const [workbookStats, setWorkbookStats] = useState({ name: '', sheets: 0, rows: 0, ignored: 0, valid: 0 });
  const [headers, setHeaders] = useState<string[]>([]);
  
  // Import State
  const [progress, setProgress] = useState(0);
  const [summary, setSummary] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    validateAndProcessFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
  };

  const validateAndProcessFile = (f: File) => {
    if (!f.name.endsWith('.xlsx') && !f.name.endsWith('.xls')) {
      toast.error((dict.importPage as any).fileFormatError || 'Only .xlsx and .xls files are allowed');
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      toast.error((dict.importPage as any).fileSizeError || 'File exceeds maximum size of 10MB');
      return;
    }
    setFile(f);
    parseExcel(f);
  };

  const parseExcel = (f: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        let allData: any[] = [];
        let validSheetsCount = 0;

        let ignoredEmptyRows = 0;

        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
          if (sheetData.length > 0) {
            allData = allData.concat(sheetData);
            validSheetsCount++;
          }
        });

        if (allData.length === 0) {
          toast.error((dict.importPage as any).emptyFileError || 'Excel file is empty');
          setFile(null);
          return;
        }

        const templateHeaders = [
          'ي', 'الطالب', 'صف', 'يوم', 'الساعه',
          'نوع', 'شهر', 'ملاحظات', 'السعر', 'التاريخ', 'المستلم'
        ];

        // Format data and apply strict validation
        const formattedData: any[] = [];
        allData.forEach(row => {
          const fullName = row['الطالب']?.toString().trim();
          
          // Strict validation: if 'الطالب' is empty, only spaces, or missing, completely ignore the row
          if (!fullName) {
            // Also ensure the row wasn't just entirely blank
            const values = Object.values(row).join('').trim();
            if (values.length > 0) ignoredEmptyRows++; // Only count it if it had SOME data but no name
            return;
          }

          formattedData.push({
            excelStudentId: row['ي']?.toString(),
            studentName: fullName,
            grade: row['صف']?.toString(),
            day: row['يوم']?.toString(),
            time: row['الساعه']?.toString(),
            studentType: row['نوع']?.toString(),
            month: row['شهر']?.toString(),
            notes: row['ملاحظات']?.toString(),
            monthlyFee: row['ملاحظات']?.toString(), // Mapping 'ملاحظات' to Price as requested
            createdDate: row['التاريخ']?.toString(),
            receiver: row['المستلم']?.toString(),
          });
        });

        setWorkbookStats({
          name: f.name,
          sheets: validSheetsCount,
          rows: allData.length,
          ignored: ignoredEmptyRows,
          valid: formattedData.length
        });
        
        setHeaders(templateHeaders);
        setRawData(formattedData);
        setStep('PREVIEW');
      } catch (err) {
        toast.error(dict.importPage.corruptedFileError || 'Failed to parse Excel file. Is it corrupted?');
        setFile(null);
      }
    };
    reader.readAsBinaryString(f);
  };

  const handleImport = async () => {
    setStep('IMPORTING');
    setProgress(20);

    const result = await processExcelImport(rawData);

    setProgress(100);

    if (result.error) {
      setError(result.error);
    } else {
      setSummary(result.summary);
      toast.success(dict.importPage.importSuccess || 'Import completed successfully!');
    }
    
    setStep('SUMMARY');
  };

  const reset = () => {
    setFile(null);
    setRawData([]);
    setWorkbookStats({ name: '', sheets: 0, rows: 0, ignored: 0, valid: 0 });
    setHeaders([]);
    setSummary(null);
    setError(null);
    setProgress(0);
    setStep('UPLOAD');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  if (step === 'UPLOAD') {
    return (
      <Card className="max-w-2xl mx-auto mt-8 border-dashed border-2 shadow-none border-muted-foreground/25">
        <CardContent className="p-12 text-center">
          <div 
            className={`flex flex-col items-center justify-center space-y-4 p-8 rounded-xl transition-colors cursor-pointer ${isDragging ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="w-16 h-16 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-2">
              <Upload className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-semibold">{dict.importPage.uploadFile || 'Upload Excel File'}</h3>
            <p className="text-muted-foreground">{dict.importPage.uploadFileDesc || 'Upload your completed Excel file to import students.'}</p>
            <p className="text-xs text-muted-foreground">{dict.importPage.maxSize || 'Max file size: 10MB'}</p>
            <input 
              type="file" 
              className="hidden" 
              accept=".xlsx,.xls" 
              ref={fileInputRef}
              onChange={handleFileSelect}
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (step === 'PREVIEW') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{dict.importPage.previewTitle}</h2>
            <p className="text-muted-foreground">{dict.importPage.previewSubtitle}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={reset}>{dict.importPage.cancel}</Button>
            <Button onClick={handleImport}>{dict.importPage.confirm}</Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <Card className="shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{dict.importPage.excelRows}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{workbookStats.rows}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-orange-500/20">
            <CardHeader className="pb-2 bg-orange-500/5">
              <CardTitle className="text-sm font-medium text-orange-600 uppercase tracking-wider">{dict.importPage.ignoredEmpty}</CardTitle>
            </CardHeader>
            <CardContent className="bg-orange-500/5">
              <div className="text-2xl font-bold text-orange-600">{workbookStats.ignored}</div>
            </CardContent>
          </Card>
          <Card className="shadow-sm border-green-500/20">
            <CardHeader className="pb-2 bg-green-500/5">
              <CardTitle className="text-sm font-medium text-green-600 uppercase tracking-wider">{dict.importPage.detectedStudents}</CardTitle>
            </CardHeader>
            <CardContent className="bg-green-500/5">
              <div className="text-2xl font-bold text-green-600">{workbookStats.valid}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/50">
            <CardTitle className="text-lg">{dict.importPage.dataPreview}</CardTitle>
            <CardDescription>{dict.importPage.dataPreviewDesc}</CardDescription>
          </CardHeader>
          <div className="overflow-x-auto max-h-[500px]">
            <Table>
              <TableHeader className="bg-muted/50 sticky top-0 z-10">
                <TableRow>
                  {headers.map(h => (
                    <TableHead key={h} className="whitespace-nowrap font-semibold">{h}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {rawData.slice(0, 20).map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium whitespace-nowrap">{row.excelStudentId || '-'}</TableCell>
                    <TableCell className="font-medium whitespace-nowrap">{row.studentName || '-'}</TableCell>
                    <TableCell>{row.grade || '-'}</TableCell>
                    <TableCell>{row.day || '-'}</TableCell>
                    <TableCell>{row.time || '-'}</TableCell>
                    <TableCell>{row.studentType || '-'}</TableCell>
                    <TableCell>{row.month || '-'}</TableCell>
                    <TableCell className="truncate max-w-[150px]">{row.notes || '-'}</TableCell>
                    <TableCell>{row.monthlyFee || '-'}</TableCell>
                    <TableCell>{row.createdDate || '-'}</TableCell>
                    <TableCell>{row.receiver || '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    );
  }

  if (step === 'IMPORTING') {
    return (
      <Card className="max-w-md mx-auto mt-16 shadow-lg border-primary/20">
        <CardContent className="p-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <div>
            <h3 className="text-xl font-bold">{dict.importPage.importing}</h3>
            <p className="text-muted-foreground mt-2">{dict.importPage.pleaseWait.replace('records', workbookStats.rows.toString())}</p>
          </div>
          <Progress value={progress} className="h-2" />
        </CardContent>
      </Card>
    );
  }

  if (step === 'SUMMARY') {
    if (error) {
      return (
        <Card className="max-w-lg mx-auto mt-8 border-destructive/50">
          <CardContent className="p-8 text-center space-y-4">
            <div className="mx-auto w-16 h-16 bg-destructive/10 text-destructive flex items-center justify-center rounded-full">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-destructive">{dict.importPage.importFailed}</h3>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={reset} className="mt-4" variant="outline">{dict.importPage.tryAgain}</Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="max-w-3xl mx-auto mt-8 space-y-6">
        <Card className="border-green-500/30 overflow-hidden shadow-lg">
          <div className="bg-green-500/10 p-6 flex flex-col items-center justify-center border-b border-green-500/20">
            <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-green-700 dark:text-green-400">{dict.importPage.importSuccess}</h2>
          </div>
          <CardContent className="p-8">
            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="p-4 bg-muted/30 rounded-xl text-center">
                <div className="text-4xl font-black text-primary">{summary.imported}</div>
                <div className="text-sm text-muted-foreground mt-1 font-medium uppercase tracking-wider">{dict.importPage.newStudents}</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl text-center">
                <div className="text-4xl font-black text-blue-500">{summary.updated}</div>
                <div className="text-sm text-muted-foreground mt-1 font-medium uppercase tracking-wider">{dict.importPage.updated}</div>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl text-center">
                <div className="text-4xl font-black text-orange-500">{summary.skipped}</div>
                <div className="text-sm text-muted-foreground mt-1 font-medium uppercase tracking-wider">{dict.importPage.skipped}</div>
              </div>
            </div>

            {summary.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-destructive flex items-center">
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {dict.importPage.errorsWarnings} ({summary.errors.length})
                </h4>
                <div className="bg-destructive/5 text-destructive rounded-lg p-4 text-sm max-h-48 overflow-y-auto space-y-1">
                  {summary.errors.map((err: string, i: number) => (
                    <div key={i} className="font-mono">{err}</div>
                  ))}
                </div>
              </div>
            )}
            
            <div className="flex justify-center mt-8">
              <Button onClick={reset} size="lg" className="rounded-xl px-8">{dict.importPage.importAnother}</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
