import { Link } from "react-router-dom"

const MovieGallery = ({ movies, conversionProgress }) => {
  // CSS для анимаций
  const appleStyles = `
    @keyframes shimmer {
      0% { transform: translateY(120%); }
      100% { transform: translateY(-120%); }
    }

    .poster-container {
      position: relative;
      width: 100%;
      aspect-ratio: 2/3;
      background: #111;
      overflow: hidden;
    }

    .poster-img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: filter 1.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s ease;
    }

    /* Когда фильм в обработке — он ЧБ и темный */
    .is-processing {
      filter: grayscale(1) brightness(0.4);
    }

    /* Когда готов — становится цветным */
    .is-ready {
      filter: grayscale(0) brightness(1);
    }

    /* Эффект блика Apple */
    .shimmer-layer {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      background: linear-gradient(
        to bottom,
        transparent,
        rgba(255, 255, 255, 0.08),
        transparent
      );
      animation: shimmer 3s infinite linear;
      z-index: 2;
      pointer-events: none;
    }

    /* Контейнер для текста прогресса */
    .progress-overlay {
      position: absolute;
      top: 0; left: 0; width: 100%; height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 3;
      color: white;
      font-family: sans-serif;
    }

    .percent-text {
      font-size: 1.5rem;
      font-weight: 800;
      letter-spacing: -1px;
      margin-bottom: 8px;
      text-shadow: 0 4px 10px rgba(0,0,0,0.5);
    }

    /* Тонкая линия прогресса снизу */
    .progress-bar-mini {
      position: absolute;
      bottom: 0; left: 0; height: 4px;
      background: #e50914;
      transition: width 0.4s ease;
      box-shadow: 0 0 10px #e50914;
      z-index: 4;
    }
  `

 return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
      gap: '30px',
      padding: '40px',
      maxWidth: '1300px',
      margin: '0 auto'
    }}>
      <style>{appleStyles}</style>
      
      {movies.map((movie) => {
        const pureName = movie.fileName.replace(/\.[^/.]+$/, "")
        const sseKeys = Object.keys(conversionProgress)
        const matchedKey = sseKeys.find(key => 
          pureName === key || pureName.includes(key) || key.includes(pureName)
        );
        
        const livePercent = matchedKey ? conversionProgress[matchedKey] : 0
        
        const showAsReady = movie.status === 'ready'
        const finalIsProcessing = !showAsReady

        return (
          <div key={movie.fileName} style={{ position: 'relative' }}>
            <Link 
              // Если в процессе — ссылка неактивна, если готов — ведем в плеер
              to={finalIsProcessing? '#' : `/movies/${encodeURIComponent(movie.playFile)}`}
              style={{ 
                textDecoration: 'none', 
                color: 'white',
                cursor: finalIsProcessing ? 'default' : 'pointer'
              }}
            >
              <div className="poster-container" style={{
                borderRadius: '12px',
                border: `1px solid ${finalIsProcessing ? '#333' : '#222'}`,
                transition: 'border-color 0.3s'
              }}>
                
                {/* 1. Слой с бликом и оверлеем (показываем, пока НЕ готов) */}
                {finalIsProcessing && (
                  <>
                    <div className="shimmer-layer" />
                    <div className="progress-overlay">
                      {/* Если процентов еще нет (0), пишем "Waiting", если есть — число */}
                      <span className="percent-text">{livePercent > 0 ? `${livePercent}%` : '...'}</span>
                      <span style={{ fontSize: '0.6rem', opacity: 0.6, textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Optimizing
                      </span>
                    </div>
                    {/* Мини прогресс-бар внизу карточки */}
                    <div className="progress-bar-mini" style={{ width: `${livePercent}%` }} />
                  </>
                )}

                {/* 2. Само изображение */}
                <img 
                  src={movie.fullPosterUrl || 'https://via.placeholder.com/300x450?text=No+Poster'} 
                  alt={movie.title}
                  // Класс меняется строго по нашей новой логике
                  className={`poster-img ${finalIsProcessing ? 'is-processing' : 'is-ready'}`}
                />
              </div>

              {/* Заголовок */}
              <div style={{ marginTop: '12px' }}>
                <h4 style={{ 
                  margin: 0, 
                  fontSize: '0.9rem', 
                  whiteSpace: 'nowrap', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis',
                  // Приглушаем текст, если фильм еще не готов
                  opacity: finalIsProcessing ? 0.4 : 1,
                  transition: 'opacity 0.5s'
                }}>
                  {movie.title}
                </h4>
              </div>
            </Link>
          </div>
        )
      })}
    </div>
  )
}

export default MovieGallery