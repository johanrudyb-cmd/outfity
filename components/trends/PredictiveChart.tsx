
'use client';

import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, ReferenceDot, ReferenceArea, Label
} from 'recharts';
import { Lock } from 'lucide-react';

interface PredictiveChartProps {
    data: {
        date: string;
        value: number;
        isFuture?: boolean;
    }[];
    color: string;
    predictionColor?: string;
    isFree?: boolean;
}

export function PredictiveChart({ data, color, predictionColor = '#007AFF', isFree = false }: PredictiveChartProps) {
    // 1. On sépare les données en deux séries qui se CHEVAUCHENT au point "Aujourd'hui"
    // pour éviter qu'il y ait un trou dans la courbe.

    // Index du dernier point réel (Aujourd'hui)
    const todayIndex = data.findIndex(d => d.isFuture) - 1;

    const processedData = data.map((d, i) => {
        const isHistory = !d.isFuture;
        // Le point de transition (Aujourd'hui) doit appartenir aux DEUX séries
        const isTransition = (i === todayIndex);

        return {
            date: d.date,
            // Valeur Historique : existe si c'est le passé OU si c'est le point de transition
            valHistory: (isHistory || isTransition) ? d.value : null,
            // Valeur Prédiction : existe si c'est le futur OU si c'est le point de transition
            valPrediction: (!isHistory || isTransition) ? d.value : null,
            original: d
        };
    });

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                <defs>
                    <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.15} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorPrediction" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={predictionColor} stopOpacity={0.1} />
                        <stop offset="95%" stopColor={predictionColor} stopOpacity={0} />
                    </linearGradient>
                    {/* Filtre de flou beaucoup plus fort pour cacher complètement la courbe */}
                    <filter id="predictionBlur" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="12" />
                        <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 15 -10" />
                    </filter>
                </defs>

                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />

                <XAxis
                    dataKey="date"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#C7C7CC', fontSize: 10, fontWeight: '700' }}
                    minTickGap={40}
                    dy={15}
                />
                <YAxis hide domain={['dataMin - 15', 'dataMax + 15']} />

                <Tooltip
                    cursor={isFree ? false : { stroke: '#E5E5E5', strokeWidth: 1 }}
                    contentStyle={{
                        borderRadius: '20px',
                        border: '1px solid rgba(0,0,0,0.05)',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
                        backdropFilter: 'blur(10px)',
                        backgroundColor: 'rgba(255,255,255,0.9)',
                        padding: '12px 16px'
                    }}
                    itemStyle={{ fontWeight: '900', fontSize: '13px', textTransform: 'uppercase' }}
                    labelStyle={{ color: '#8E8E93', marginBottom: '4px', fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px' }}
                    formatter={(value: number | undefined, name: string | undefined) => {
                        if (value === undefined) return ['', ''];
                        if (isFree && name === 'valPrediction') return ['Verrouillé', 'PLAN CREATOR REQUIS'];
                        if (name === 'valHistory') return [`${value} pts`, 'Score Réel'];
                        if (name === 'valPrediction') return [`${value} pts`, 'Potentiel'];
                        return [value.toString(), name || ''];
                    }}
                />

                {/* 1. COURBE HISTORIQUE (Visible pour tous) */}
                <Area
                    type="monotone"
                    dataKey="valHistory"
                    stroke={color}
                    strokeWidth={4}
                    fill="url(#colorHistory)"
                    fillOpacity={1}
                    connectNulls={false}
                    activeDot={{ r: 6, strokeWidth: 2, stroke: '#fff', fill: color }}
                    name="valHistory"
                    animationDuration={1500}
                />

                {/* 2. COURBE PRÉDICTION (Totalement brouillée si gratuit) */}
                <Area
                    type="monotone"
                    dataKey="valPrediction"
                    stroke={predictionColor}
                    strokeWidth={4}
                    strokeDasharray="8 6"
                    fill="url(#colorPrediction)"
                    fillOpacity={isFree ? 0.05 : 1}
                    connectNulls={false}
                    activeDot={isFree ? false : { r: 6, strokeWidth: 2, stroke: '#fff', fill: predictionColor }}
                    name="valPrediction"
                    animationDuration={2000}
                    // Application du filtre si gratuit
                    style={isFree ? { filter: 'url(#predictionBlur)', opacity: 0.1 } : undefined}
                />

                {/* Vertical Line: TODAY */}
                {todayIndex >= 0 && (
                    <ReferenceLine
                        x={data[todayIndex].date}
                        stroke="#000"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                        label={{
                            position: 'top',
                            value: 'AUJOURD\'HUI',
                            fill: '#000',
                            fontSize: 9,
                            fontWeight: '900',
                            dy: -10
                        }}
                    />
                )}

                {/* Prediction Zone Indicator */}
                {todayIndex >= 0 && (
                    <ReferenceArea
                        x1={data[todayIndex].date}
                        x2={data[data.length - 1].date}
                        fill={isFree ? '#F9F9FB' : predictionColor}
                        fillOpacity={isFree ? 0.95 : 0.05}
                        stroke={isFree ? '#F0F0F0' : 'none'}
                        strokeWidth={1}
                    >
                        {isFree ? (
                            <Label
                                content={(props: any) => {
                                    const { viewBox } = props;
                                    const { x, y, width, height } = viewBox;
                                    return (
                                        <g>
                                            <foreignObject x={x + width / 2 - 40} y={y + height / 2 - 30} width="80" height="60">
                                                <div className="flex flex-col items-center justify-center h-full gap-2">
                                                    <div className="w-10 h-10 bg-white rounded-full shadow-apple flex items-center justify-center border border-black/5">
                                                        <Lock className="w-5 h-5 text-[#007AFF]" />
                                                    </div>
                                                    <span className="text-[9px] font-black text-[#8E8E93] uppercase tracking-tighter">PLAN CREATOR</span>
                                                </div>
                                            </foreignObject>
                                        </g>
                                    );
                                }}
                            />
                        ) : (
                            <Label
                                value="PRÉVISION"
                                position="insideTopRight"
                                fill={predictionColor}
                                fontSize={10}
                                fontWeight="900"
                                offset={20}
                            />
                        )}
                    </ReferenceArea>
                )}

                {/* Point Final : SORTIE */}
                {!isFree && (
                    <ReferenceDot
                        x={data[data.length - 1].date}
                        y={data[data.length - 1].value}
                        r={6}
                        fill={predictionColor}
                        stroke="#fff"
                        strokeWidth={2}
                    />
                )}

            </AreaChart>
        </ResponsiveContainer>
    );
}
