const loginAnimation = {
  background: {
    hidden: {
      opacity: 0,
    },
    show: {
      opacity: 1,
      transition: {
        duration: 1.2,
      },
    },
  },

  paper: {
    hidden: {
      opacity: 0,
      y: 50,
      scale: 0.96,
      rotateX: 10,
    },
    show: {
      opacity: 1,
      y: 0,
      scale: 1,
      rotateX: 0,
      transition: {
        duration: 0.9,
        ease: "easeOut",
      },
    },
  },

  logo: {
    animate: {
      y: [0, -8, 0],
      rotate: [0, -3, 3, 0],
      boxShadow: [
        "0 10px 25px rgba(0,0,0,.15)",
        "0 18px 35px rgba(53,105,79,.35)",
        "0 10px 25px rgba(0,0,0,.15)",
      ],
      transition: {
        duration: 5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },

  title: {
    hidden: {
      opacity: 0,
      y: 20,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.3,
        duration: 0.8,
      },
    },
  },

  subtitle: {
    hidden: {
      opacity: 0,
      y: 15,
    },
    show: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.55,
        duration: 0.8,
      },
    },
  },

  button: {
    hover: {
      scale: 1.03,
      y: -2,
      boxShadow: "0 18px 35px rgba(53,105,79,.35)",
      transition: {
        duration: 0.25,
      },
    },

    tap: {
      scale: 0.98,
    },
  },

  buttonLight: {
    animate: {
      x: ["-180%", "250%"],
      transition: {
        duration: 2.6,
        repeat: Infinity,
        ease: "linear",
      },
    },
  },

  arrow: {
    animate: {
      x: [0, 6, 0],
      transition: {
        duration: 1,
        repeat: Infinity,
      },
    },
  },

  sparkle: {
    animate: {
      scale: [1, 1.7, 1],
      opacity: [0.4, 1, 0.4],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },

  leafOne: {
    animate: {
      x: [0, 20, 0],
      y: [0, -20, 0],
      rotate: [0, 10, -10, 0],
      transition: {
        duration: 10,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },

  leafTwo: {
    animate: {
      x: [0, -25, 0],
      y: [0, 20, 0],
      rotate: [0, -12, 12, 0],
      transition: {
        duration: 12,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },

  feather: {
    animate: {
      y: [0, -30, 0],
      x: [0, 12, 0],
      rotate: [0, 15, -15, 0],
      opacity: [0.08, 0.18, 0.08],
      transition: {
        duration: 8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  },
};

export default loginAnimation;
