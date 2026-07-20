'use client';

import { useState, useMemo } from 'react';
import { StudentCard } from '@/components/student/StudentCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Printer, Search, ArrowLeft } from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';

interface PrintCardsClientProps {
  students: any[];
  uniqueGrades: string[];
  dict: any;
  centerName: string;
  teacherName: string;
}

export function PrintCardsClient({
  students,
  uniqueGrades,
  dict,
  centerName,
  teacherName
}: PrintCardsClientProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('all');
  const { theme, setTheme } = useTheme();

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.studentId.includes(searchQuery);
      
      const matchesGrade = selectedGrade === 'all' || student.grade === selectedGrade;

      return matchesSearch && matchesGrade;
    });
  }, [students, searchQuery, selectedGrade]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Control Bar */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border p-4 print:hidden">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center gap-4 justify-between">
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Link href="/dashboard/students">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="w-5 h-5 rtl:rotate-180" />
              </Button>
            </Link>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search Name or ID..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="flex h-10 w-full sm:w-40 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
            >
              <option value="all">All Grades</option>
              {uniqueGrades.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              Toggle Theme
            </Button>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="w-4 h-4" />
              Print Visible ({filteredStudents.length})
            </Button>
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="p-4 sm:p-8">
        <div className="flex flex-wrap justify-center gap-6 print:gap-4 print:p-0">
          {filteredStudents.map(student => (
            <div key={student.id} className="relative group print:m-2">
              <div className="print:w-[320px]">
                <StudentCard 
                  student={student} 
                  dict={dict} 
                  centerName={centerName} 
                  teacherName={teacherName} 
                />
              </div>
              <div className="absolute top-8 right-6 z-10 opacity-0 group-hover:opacity-100 transition-opacity print:hidden">
                <Button 
                  size="icon" 
                  variant="secondary" 
                  className="rounded-full shadow-md"
                  onClick={(e) => {
                    const originalDisplays = new Map();
                    // Hide all other cards
                    document.querySelectorAll('.group').forEach((el: any) => {
                      if (el !== (e.currentTarget as HTMLElement).closest('.group')) {
                        originalDisplays.set(el, el.style.display);
                        el.style.display = 'none';
                      }
                    });
                    
                    window.print();
                    
                    // Restore displays
                    setTimeout(() => {
                      document.querySelectorAll('.group').forEach((el: any) => {
                        if (originalDisplays.has(el)) {
                          el.style.display = originalDisplays.get(el);
                        }
                      });
                    }, 100);
                  }}
                  title="Print this card only"
                >
                  <Printer className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {filteredStudents.length === 0 && (
            <div className="text-center text-muted-foreground p-12 w-full print:hidden">
              No students found matching your criteria.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
