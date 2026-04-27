/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // ────────────────────────────────────────────────────────────────
        // 4-색 원칙 (영상의 "메인 1 + 흑백 + 보조 1" 룰)
        //   bg     #FFFCF7  아이보리 배경
        //   ink    #1A1614  진한 잉크 (제목/본문)
        //   line   #E8DFD3  가는 구분선·placeholder
        //   coral  #C46A53  유일한 강조색 (CTA, multi-day bar)
        // 짧은 alias — 새 컴포넌트(랜딩 등)는 이걸 사용한다.
        // ────────────────────────────────────────────────────────────────
        bg: '#FFFCF7',
        'bg-soft': '#F8F1E5',
        ink: '#1A1614',
        'ink-muted': '#6B6058',
        line: '#E8DFD3',
        coral: '#C46A53',
        'coral-soft': '#F2D9D0',

        // ────────────────────────────────────────────────────────────────
        // 기존 Material Design 3 토큰 — 위 4색 팔레트로 매핑하여 통합.
        // 옛 페이지가 토큰 키 그대로 써도 새 톤이 자동 적용된다.
        // ────────────────────────────────────────────────────────────────
        surface: '#FFFCF7',
        'surface-dim': '#F0E6D5',
        'surface-bright': '#FFFCF7',
        'surface-container-lowest': '#FFFFFF',
        'surface-container-low': '#FBF6EC',
        'surface-container': '#F8F1E5',
        'surface-container-high': '#F2EAD9',
        'surface-container-highest': '#ECE2CF',
        'on-surface': '#1A1614',
        'on-surface-variant': '#6B6058',
        'inverse-surface': '#2B2420',
        'inverse-on-surface': '#FFFCF7',
        outline: '#9A8C82',
        'outline-variant': '#E8DFD3',

        // 강조 — coral 1색으로 통일
        'surface-tint': '#C46A53',
        primary: '#C46A53',
        'on-primary': '#FFFFFF',
        'primary-container': '#F2D9D0',
        'on-primary-container': '#5A2418',
        'inverse-primary': '#F2D9D0',
        'primary-fixed': '#F8E5DD',
        'primary-fixed-dim': '#E89F8E',
        'on-primary-fixed': '#370E05',
        'on-primary-fixed-variant': '#7A3526',

        // secondary/tertiary는 무채색으로 흡수 (강조 색 분산 방지)
        secondary: '#6B6058',
        'on-secondary': '#FFFFFF',
        'secondary-container': '#ECE2CF',
        'on-secondary-container': '#4A4138',
        'secondary-fixed': '#ECE2CF',
        'secondary-fixed-dim': '#C8BEB5',
        'on-secondary-fixed': '#1A1614',
        'on-secondary-fixed-variant': '#3F3530',
        tertiary: '#C46A53',
        'on-tertiary': '#FFFFFF',
        'tertiary-container': '#F2D9D0',
        'on-tertiary-container': '#5A2418',
        'tertiary-fixed': '#F8E5DD',
        'tertiary-fixed-dim': '#E89F8E',
        'on-tertiary-fixed': '#370E05',
        'on-tertiary-fixed-variant': '#7A3526',

        // 에러는 그대로 유지 (의미적 색)
        error: '#BA1A1A',
        'on-error': '#FFFFFF',
        'error-container': '#FFDAD6',
        'on-error-container': '#93000A',
        background: '#FFFCF7',
        'on-background': '#1A1614',
        'surface-variant': '#ECE2CF',
      },
      fontFamily: {
        'display-lg': ['Fraunces', 'serif'],
        'display-md': ['Fraunces', 'serif'],
        'headline-sm': ['Fraunces', 'serif'],
        'body-lg': ['Pretendard', 'sans-serif'],
        'body-md': ['Pretendard', 'sans-serif'],
        'body-sm': ['Pretendard', 'sans-serif'],
        'label-caps': ['Pretendard', 'sans-serif'],
        'mono-id': ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Fraunces', 'serif'],
        body: ['Pretendard', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
        // 손글씨 톤 — 결혼 앨범 첫 페이지 축복 메시지용
        'hand-ko': ['"Nanum Pen Script"', '"Gaegu"', 'cursive'],
        'hand-en': ['"Caveat"', 'cursive'],
      },
      fontSize: {
        'display-lg': ['48px', { lineHeight: '1.1', letterSpacing: '0.02em', fontWeight: '300' }],
        'display-md': ['32px', { lineHeight: '1.2', letterSpacing: '0.01em', fontWeight: '400' }],
        'headline-sm': ['24px', { lineHeight: '1.4', fontWeight: '500' }],
        'body-lg': ['18px', { lineHeight: '1.6', fontWeight: '400' }],
        'body-md': ['16px', { lineHeight: '1.5', fontWeight: '400' }],
        'body-sm': ['14px', { lineHeight: '1.4', fontWeight: '500' }],
        'label-caps': ['12px', { lineHeight: '1', letterSpacing: '0.05em', fontWeight: '600' }],
        'mono-id': ['13px', { lineHeight: '1', fontWeight: '400' }],
      },
      borderRadius: {
        sm: '0.25rem',
        DEFAULT: '0.5rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
        full: '9999px',
      },
      spacing: {
        base: '4px',
        xs: '8px',
        sm: '16px',
        md: '24px',
        lg: '40px',
        xl: '64px',
        'container-max': '1280px',
        gutter: '20px',
      },
      maxWidth: {
        'container-max': '1280px',
        'diary-lane': '880px',
      },
    },
  },
  plugins: [],
};
