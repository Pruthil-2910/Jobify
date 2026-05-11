import React, { useRef, useState, useEffect } from 'react';

const BLOGS = [
  {
    title: 'Vector Search on the Edge',
    url: 'https://medium.com/towards-artificial-intelligence/vector-search-on-the-edge-sensor-retrieval-with-qdrant-edge-on-ubuntu-c0518de7a536',
    desc: 'Sensor retrieval with Qdrant edge on Ubuntu.',
  },
  {
    title: 'Naive Bayes Classifiers',
    url: 'https://medium.com/gitconnected/an-architectural-deep-dive-into-naive-bayes-classifiers-3ad16b1a89aa',
    desc: 'An architectural deep dive.',
  },
  {
    title: 'Building a KNN from scratch',
    url: 'https://medium.com/towards-artificial-intelligence/beyond-predict-building-a-knn-from-scratch-dfd3405fd7f2',
    desc: 'Beyond predict: building a K-Nearest Neighbors model.',
  },
  {
    title: 'Mathematical soul of logistic regression',
    url: 'https://medium.com/towards-artificial-intelligence/beyond-the-sigmoid-the-mathematical-soul-of-logistic-regression-639fe25ab9e8',
    desc: 'Beyond the sigmoid function.',
  },
  {
    title: 'Deep dive into feature selection',
    url: 'https://medium.com/gitconnected/the-secret-sauce-of-model-performance-a-deep-dive-into-feature-selection-6a4874994e76',
    desc: 'The secret sauce of model performance.',
  },
  {
    title: 'Bias-Variance Trade-Off & L1/L2',
    url: 'https://medium.com/towards-artificial-intelligence/behind-the-scenes-of-bias-variance-trade-off-and-l1-l2-regularization-47de4167f40e',
    desc: 'Behind the scenes of regularization.',
  },
  {
    title: 'Demystifying Gradient Descent',
    url: 'https://medium.com/towards-artificial-intelligence/beyond-model-fit-demystifying-gradient-descent-from-scratch-003dd0241ddf',
    desc: 'Beyond model fit: building gradient descent from scratch.',
  }
];

function BlogCard({ blog, index }) {
  const cardRef = useRef(null);
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Calculate rotation between -15 and 15 degrees
    const xPct = (x / rect.width) - 0.5;
    const yPct = (y / rect.height) - 0.5;
    
    setRotation({
      x: yPct * -20,
      y: xPct * 20
    });
  };

  return (
    <a 
      href={blog.url} 
      target="_blank" 
      rel="noopener noreferrer"
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => { setIsHovered(false); setRotation({ x: 0, y: 0 }); }}
      onMouseMove={handleMouseMove}
      style={{
        display: 'block',
        textDecoration: 'none',
        perspective: '1000px',
        animation: `fadeInUp 0.6s ease-out ${index * 0.1}s backwards`
      }}
    >
      <div 
        className="panel"
        style={{
          padding: '24px',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          transition: isHovered ? 'none' : 'all 0.5s cubic-bezier(0.23, 1, 0.32, 1)',
          transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${isHovered ? 1.05 : 1})`,
          transformStyle: 'preserve-3d',
          cursor: 'pointer',
          background: 'linear-gradient(145deg, rgba(63, 63, 70, 0.5) 0%, rgba(24, 24, 27, 0.9) 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: isHovered 
            ? '0 20px 40px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
            : '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
      >
        <div style={{
          transform: 'translateZ(30px)',
          fontSize: '12px',
          fontWeight: 600,
          color: 'var(--star-400)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          ML Deep Dive
        </div>
        <h3 style={{
          transform: 'translateZ(40px)',
          margin: 0,
          fontSize: '18px',
          color: 'var(--star-100)',
          lineHeight: 1.4
        }}>
          {blog.title}
        </h3>
        <p style={{
          transform: 'translateZ(20px)',
          margin: 0,
          color: 'var(--star-300)',
          fontSize: '14px',
          lineHeight: 1.5,
          marginTop: 'auto'
        }}>
          {blog.desc}
        </p>
      </div>
    </a>
  );
}

export default function NotFound({ setRoute }) {
  useEffect(() => {
    // Add custom animation to document
    const style = document.createElement('style');
    style.innerHTML = `
      @keyframes fadeInUp {
        from { opacity: 0; transform: translateY(20px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes floatSlow {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(2deg); }
      }
    `;
    document.head.appendChild(style);
    return () => document.head.removeChild(style);
  }, []);

  return (
    <div style={{
      minHeight: '80vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '80px 24px',
      maxWidth: '1200px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* Decorative grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: -1, opacity: 0.3,
        backgroundImage: 'linear-gradient(to right, var(--border-hair) 1px, transparent 1px), linear-gradient(to bottom, var(--border-hair) 1px, transparent 1px)',
        backgroundSize: '40px 40px',
        maskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)',
        WebkitMaskImage: 'radial-gradient(ellipse at center, black 20%, transparent 70%)'
      }} />

      <div style={{
        textAlign: 'center',
        marginBottom: '64px',
        animation: 'fadeInUp 0.8s ease-out',
        position: 'relative',
        zIndex: 1
      }}>
        <h1 style={{
          fontSize: 'clamp(80px, 12vw, 150px)',
          fontWeight: 900,
          letterSpacing: '-0.06em',
          margin: '0 0 16px 0',
          color: 'var(--star-100)',
          lineHeight: 0.9,
          fontFamily: 'var(--font-display)',
          animation: 'floatSlow 6s ease-in-out infinite',
          textShadow: '0 20px 40px rgba(0,0,0,0.1)'
        }}>
          404
        </h1>
        <h2 style={{
          fontSize: 'clamp(24px, 4vw, 40px)',
          fontWeight: 700,
          margin: '0 0 24px 0',
          color: 'var(--star-200)',
          letterSpacing: '-0.03em'
        }}>
          Are you lost? Not yet.
        </h2>
        <p style={{
          fontSize: '18px',
          color: 'var(--star-400)',
          maxWidth: '600px',
          margin: '0 auto 32px auto',
          lineHeight: 1.6
        }}>
          Read these blogs of mine and you will definitely get lost in the world of ML.
        </p>
        <button className="btn btn-primary" onClick={() => setRoute('home')} style={{
          padding: '12px 32px', fontSize: '16px', letterSpacing: '0.02em'
        }}>
          Return Home
        </button>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
        gap: '32px',
        width: '100%',
        perspective: '1200px',
        zIndex: 1
      }}>
        {BLOGS.map((blog, idx) => (
          <BlogCard key={idx} blog={blog} index={idx} />
        ))}
      </div>
    </div>
  );
}
