"use client";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { Course } from "@/types/invoice";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { useEffect, useState } from "react";

interface CourseSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function CourseSelect({
  value,
  onValueChange,
  placeholder = "Select course...",
  className,
}: CourseSelectProps) {
  const [open, setOpen] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Fetch courses on component mount
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/courses");
      if (response.ok) {
        const coursesData = await response.json();
        setCourses(coursesData);
      }
    } catch (error) {
      console.error("Failed to fetch courses:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (courseName: string) => {
    if (!courseName.trim()) return;

    try {
      const response = await fetch("/api/courses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: courseName.trim() }),
      });

      if (response.ok) {
        const newCourse = await response.json();
        setCourses((prev) =>
          [...prev, newCourse].sort((a, b) => a.name.localeCompare(b.name)),
        );
        onValueChange(newCourse.name);
        setSearchValue("");
        setOpen(false);
      }
    } catch (error) {
      console.error("Failed to create course:", error);
    }
  };

  const filteredCourses = courses.filter((course) =>
    course.name.toLowerCase().includes(searchValue.toLowerCase()),
  );

  const selectedCourse = courses.find((course) => course.name === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between", className)}
        >
          {selectedCourse ? selectedCourse.name : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0">
        <Command>
          <CommandInput
            placeholder="Search courses..."
            value={searchValue}
            onValueChange={setSearchValue}
          />
          <CommandList>
            {loading ? (
              <CommandEmpty>Loading courses...</CommandEmpty>
            ) : (
              <>
                <CommandEmpty>
                  <div className="flex flex-col items-center gap-2 p-4">
                    <div className="text-sm text-muted-foreground">
                      No courses found
                    </div>
                    {searchValue.trim() && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCreateCourse(searchValue)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create "{searchValue}"
                      </Button>
                    )}
                  </div>
                </CommandEmpty>
                <CommandGroup>
                  {filteredCourses.map((course) => (
                    <CommandItem
                      key={course.id}
                      value={course.name}
                      onSelect={() => {
                        onValueChange(course.name);
                        setOpen(false);
                      }}
                    >
                      <Check
                        className={cn(
                          "mr-2 h-4 w-4",
                          value === course.name ? "opacity-100" : "opacity-0",
                        )}
                      />
                      {course.name}
                    </CommandItem>
                  ))}
                  {searchValue.trim() &&
                    !filteredCourses.some(
                      (course) =>
                        course.name.toLowerCase() === searchValue.toLowerCase(),
                    ) && (
                      <CommandItem
                        value={searchValue}
                        onSelect={() => handleCreateCourse(searchValue)}
                        className="gap-2"
                      >
                        <Plus className="h-4 w-4" />
                        Create "{searchValue}"
                      </CommandItem>
                    )}
                </CommandGroup>
              </>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
