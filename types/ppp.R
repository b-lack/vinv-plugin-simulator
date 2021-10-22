require(spatstat)
library(ggplot2)

# help(spatstat)
# https://de.wikipedia.org/wiki/Poisson-Verteilung

df <- data.frame(k=integer(),
                 P=integer(), 
                 B=integer()
                 )
n <- 18
L <- 3

poissonFn <- function(lam, k) {
  return(lam ^ k / factorial(k) * exp(-lam))
}
bionemial <- function(n, k, p) {
  return((n/k) * p ^ k * (1-p)^(n-k))
}


for (k in 1:n) {
  df[nrow(df) + 1,] = c(k, poissonFn(L, k), bionemial(n, k, 0.2))
}

# ----

ggplot(df, aes(x=k, y=P)) + 
  geom_bar(stat = "identity") +
  xlim(0, 18) + 
  ylim(0, 0.4)


mypattern <- ppp(df$k, df$P, c(0,18), c(0,0.4))

#plot(mypattern)

#summary(mypattern)

#plot(Kest(mypattern))

#plot(envelope(mypattern,Kest))

#plot(density(mypattern))
#help(density.ppp)


# https://www.programmingr.com/examples/neat-tricks/sample-r-function/rpois-poisson-distribution/
#Simulation window parameters
xMin=0;xMax=1;
yMin=0;yMax=1;
xDelta=xMax-xMin;
yDelta=yMax-yMin; #rectangle dimensions

areaTotal=xDelta*yDelta;

#Point process parameters
lambda=100; #intensity (ie mean density) of the Poisson process

#Simulate Poisson point process
numbPoints=rpois(1,areaTotal*lambda);#Poisson number of points
xx=xDelta*runif(numbPoints)+xMin;#x coordinates of Poisson points
yy=xDelta*runif(numbPoints)+yMin;#y coordinates of Poisson points

#Plotting
# https://stat.ethz.ch/R-manual/R-devel/library/stats/html/Poisson.html
plot(xx,yy,'p',xlab='x',ylab='y',col='blue')

# https://www-ljk.imag.fr/membres/Jean-Francois.Coeurjolly/documents/lecture2.pdf
# inhomogeneous
intenfun <- function(x, y) 100 * x
t <- rpoispp(intenfun, lmax = 200)
plot(t, main = "")

# homogeneous
plot(rpoispp(1000, lmax = 100), main = "")

intenim <- as.im(intenfun, dimyx = c(100, 100), W = unit.square())
plot(rpoispp(intenim), main = "")

# eigene Rechnung: homogeneous
# https://rdrr.io/cran/spatstat.core/src/R/random.R
lambda <- 100
meanN <- lambda * 1*1 # area(box)
n <- rpois(1, meanN) # n, Lambda

le <- poissonFn(10, 100)
P <-  lambda ^ meanN * exp(-lambda)/factorial(meanN)
  

df <- as.data.frame(lambda)

xx <- runif(lambda, -5, 5)
yy <- runif(lambda, -5, 5)
lala <- ppp(xx, yy, window = owin(xrange=c(-5,5), yrange=c(-5,5)), check = FALSE)
plot(lala, main = "", xrange=10, yrange=10)


result <- runifpoispp(50, owin(xrange=c(-5,5), yrange=c(-5,5)), nsim = 5, drop = FALSE)

u01 <- owin(0:1,0:1)
plot(runifpoispp(200, u01)) #uniform Poisson point process



