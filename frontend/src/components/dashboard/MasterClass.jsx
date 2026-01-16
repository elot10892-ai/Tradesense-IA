import React, { useState, useEffect } from 'react';
import { GraduationCap, Play, Clock, X, Loader2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../api/axios';

const MasterClass = () => {
    const [filter, setFilter] = useState('Tous');
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [currentIndex, setCurrentIndex] = useState(-1);

    useEffect(() => {
        fetchMasterClasses();
    }, [filter]);

    const fetchMasterClasses = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/api/masterclasses?level=${filter === 'Tous' ? '' : filter}`);
            setCourses(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching masterclasses:', err);
            setError('Impossible de charger les masterclasses');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenVideo = (course, index) => {
        setSelectedVideo(course);
        setCurrentIndex(index);
    };

    const handleNext = () => {
        if (currentIndex < courses.length - 1) {
            const nextIndex = currentIndex + 1;
            setSelectedVideo(courses[nextIndex]);
            setCurrentIndex(nextIndex);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            const prevIndex = currentIndex - 1;
            setSelectedVideo(courses[prevIndex]);
            setCurrentIndex(prevIndex);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12 px-4 font-primary">
            {/* Header section with Filter */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/10 rounded-xl border border-primary/20">
                        <GraduationCap className="text-primary w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-text-primary tracking-tight uppercase">Centre MasterClass</h1>
                        <p className="text-xs text-text-secondary font-bold uppercase tracking-widest">Formation Prop Trading TradeSense</p>
                    </div>
                </div>

                <div className="flex bg-background-card p-1 rounded-xl border border-border overflow-x-auto no-scrollbar shadow-sm">
                    {['Tous', 'Débutant', 'Intermédiaire', 'Avancé'].map(cat => (
                        <button
                            key={cat}
                            onClick={() => setFilter(cat)}
                            className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase transition-all whitespace-nowrap ${filter === cat ? 'bg-primary text-black shadow-lg shadow-primary/20' : 'text-text-secondary hover:text-text-primary hover:bg-background-input/50'}`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {error && (
                <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl flex items-center gap-3 text-danger animate-shake mb-6">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 text-text-secondary">
                    <Loader2 className="w-10 h-10 animate-spin mb-4 text-primary" />
                    <p className="font-black uppercase text-[10px] tracking-widest opacity-50">Accès à la médiathèque locale...</p>
                </div>
            ) : courses.length === 0 ? (
                <div className="text-center py-20 bg-background-card rounded-2xl border border-border border-dashed shadow-sm">
                    <div className="w-12 h-12 text-text-secondary/20 mx-auto mb-4 bg-background-input rounded-full flex items-center justify-center">
                        <GraduationCap className="w-6 h-6" />
                    </div>
                    <p className="text-text-secondary font-bold uppercase text-xs tracking-widest">Aucun cours trouvé</p>
                    <p className="text-text-secondary text-[10px] mt-2 font-bold opacity-50">Ajustez vos filtres ou revenez plus tard.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courses.map((course, index) => (
                        <div key={course.id || index} className="bg-background-card rounded-2xl border border-border overflow-hidden hover:border-primary/50 transition-all group flex flex-col shadow-lg">
                            <div
                                className="relative h-48 overflow-hidden bg-background-input flex items-center justify-center cursor-pointer"
                                onClick={() => handleOpenVideo(course, index)}
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-black/40 to-transparent z-10"></div>
                                <div className="w-full h-full bg-[#1e1e1e] flex flex-col items-center justify-center gap-2">
                                    <GraduationCap className="w-12 h-12 text-primary/20" />
                                    <span className="text-[10px] font-black text-primary/30 uppercase tracking-[0.3em]">TradeSense ACADEMY</span>
                                </div>

                                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                                    <div className="p-4 bg-primary rounded-full shadow-2xl transform scale-75 group-hover:scale-100 transition-transform flex items-center justify-center">
                                        <Play className="w-6 h-6 text-black fill-current translate-x-0.5" />
                                    </div>
                                </div>

                                <div className="absolute bottom-3 left-3 flex gap-2 z-20">
                                    <span className={`backdrop-blur-md text-[9px] font-black text-white px-2 py-1 rounded-lg uppercase border border-white/20 ${course.level === 'Débutant' ? 'bg-success/60' :
                                            course.level === 'Intermédiaire' ? 'bg-orange-500/60' : 'bg-danger/60'
                                        }`}>
                                        {course.level}
                                    </span>
                                </div>
                            </div>

                            <div className="p-6 flex-1 flex flex-col">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-black text-text-primary line-clamp-1 group-hover:text-primary transition-colors">{course.title}</h3>
                                    <span className="text-[8px] bg-background-input px-2 py-1 rounded-full font-black text-text-secondary uppercase">{course.category}</span>
                                </div>
                                <p className="text-sm text-text-secondary mb-6 line-clamp-2 leading-relaxed font-medium italic">
                                    "{course.description}"
                                </p>
                                <div className="mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-text-secondary text-[10px] font-bold uppercase">
                                        <Clock className="w-3 h-3 text-primary" />
                                        {course.duration}
                                    </div>
                                    <button
                                        onClick={() => handleOpenVideo(course, index)}
                                        className="px-5 py-2.5 bg-background-input border border-border hover:bg-primary hover:text-black hover:border-primary rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2"
                                    >
                                        <Play className="w-3 h-3" /> Regarder
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Video Player Modal */}
            {selectedVideo && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-md" onClick={() => setSelectedVideo(null)}></div>
                    <div className="relative bg-background-card w-full max-w-5xl rounded-2xl border border-border shadow-2xl overflow-hidden animate-zoom-in">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-border bg-background-input/50">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-primary/10 rounded-lg">
                                    <Play className="text-primary w-4 h-4" />
                                </div>
                                <div>
                                    <h2 className="text-sm font-black text-text-primary uppercase tracking-tight">{selectedVideo.title}</h2>
                                    <p className="text-[10px] text-text-secondary font-bold uppercase tracking-widest">{selectedVideo.level} • {selectedVideo.category}</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedVideo(null)} className="p-2 hover:bg-danger/10 hover:text-danger rounded-xl transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Player Area */}
                        <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                            {selectedVideo.video_url ? (
                                <video
                                    className="w-full h-full"
                                    controls
                                    autoPlay
                                    src={selectedVideo.video_url}
                                >
                                    Votre navigateur ne supporte pas la lecture vidéo MP4.
                                </video>
                            ) : (
                                <div className="flex flex-col items-center justify-center text-center p-12">
                                    <AlertCircle className="w-16 h-16 text-warning mb-4" />
                                    <h3 className="text-xl font-black text-white uppercase mb-2">Vidéo indisponible</h3>
                                    <p className="text-text-secondary text-sm">Contenu en cours de synchronisation.</p>
                                </div>
                            )}

                            {/* Navigation controls overlay */}
                            <div className="absolute inset-y-0 left-0 flex items-center px-4 pointer-events-none group/nav">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handlePrevious(); }}
                                    disabled={currentIndex === 0}
                                    className={`p-4 bg-black/60 hover:bg-primary hover:text-black text-white rounded-full backdrop-blur-md transition-all border border-white/10 pointer-events-auto ${currentIndex === 0 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/nav:opacity-100'}`}
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                            </div>
                            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none group/nav">
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleNext(); }}
                                    disabled={currentIndex === courses.length - 1}
                                    className={`p-4 bg-black/60 hover:bg-primary hover:text-black text-white rounded-full backdrop-blur-md transition-all border border-white/10 pointer-events-auto ${currentIndex === courses.length - 1 ? 'opacity-0 pointer-events-none' : 'opacity-0 group-hover/nav:opacity-100'}`}
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        {/* Info Section */}
                        <div className="p-6 bg-background-card border-t border-border">
                            <div className="flex flex-col md:flex-row justify-between gap-8">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1 h-3 bg-primary rounded-full"></div>
                                        <h4 className="text-[11px] font-black text-text-secondary uppercase tracking-[0.2em]">Syllabus de la Leçon</h4>
                                    </div>
                                    <p className="text-text-primary text-sm leading-relaxed font-medium">
                                        {selectedVideo.description}
                                    </p>
                                </div>
                                <div className="md:w-64 pt-6 md:pt-0 border-t md:border-t-0 md:border-l border-border md:pl-8 flex flex-col justify-end">
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">MasterClass {currentIndex + 1} / {courses.length}</span>
                                        <span className="text-[10px] font-black text-primary uppercase">Validé</span>
                                    </div>
                                    <button
                                        onClick={handleNext}
                                        disabled={currentIndex === courses.length - 1}
                                        className="w-full py-3.5 bg-background-input hover:bg-primary hover:text-black border border-border hover:border-primary rounded-xl text-[11px] font-black uppercase transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                                    >
                                        Cours suivant <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MasterClass;
