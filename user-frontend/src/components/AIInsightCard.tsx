import { LucideIcon } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { CheckCircle2 } from 'lucide-react'

interface AIInsightCardProps {
    title: string
    icon: LucideIcon
    items: string[]
    accentClass?: string
}

export default function AIInsightCard({
    title,
    icon: Icon,
    items,
    accentClass = 'text-primary'
}: AIInsightCardProps): JSX.Element {
    return (
        <Card className="glass-card border-white/10 backdrop-blur-xl h-full">
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${accentClass}`} />
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>
                {items.length > 0 ? (
                    <ul className="space-y-2">
                        {items.map((item, index) => (
                            <li key={`${title}-${index}`} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500 shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-muted-foreground">No major signals detected for this category.</p>
                )}
            </CardContent>
        </Card>
    )
}
