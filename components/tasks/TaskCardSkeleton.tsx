import { Card, CardContent } from "../ui/card"
import { Skeleton } from "../ui/skeleton"

export default function TaskCardSkeleton() {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Task Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-4" />
            </div>
            <Skeleton className="h-6 w-16" />
          </div>

          {/* Task Description */}
          <div className="space-y-1">
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-3/4" />
          </div>

          {/* Project */}
          <Skeleton className="h-5 w-24" />

          {/* Task Footer */}
          <div className="flex items-center justify-between pt-2 border-t">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-3 w-20" />
            </div>
            
            {/* Creator Info */}
            <div className="flex items-center space-x-2 space-x-reverse">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-24" />
            </div>
            
            <div className="flex items-center space-x-2 space-x-reverse">
              <div className="flex items-center text-xs">
                <Skeleton className="h-3 w-3 mr-1" />
                <Skeleton className="h-3 w-16" />
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center space-x-1 space-x-reverse">
                <Skeleton className="h-6 w-6 rounded" />
                <Skeleton className="h-6 w-6 rounded" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 